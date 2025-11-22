import { supabase } from '../supabase';
import { getRandomCategoryImage } from '../utils/petitionCategoriesService';

/**
 * Migrate existing petitions to add auto-generated images
 * Run this ONCE on app startup or manually
 */
export const migrateExistingPetitionsWithImages = async () => {
  try {
    console.log('🔄 Starting petition image migration...');

    // Get all petitions without images
    const { data: petitionsData, error: fetchError } = await supabase
      .from('petitions')
      .select('id, category, image_url')
      .or('image_url.is.null,image_url.eq.""')
      .limit(100); // Process in batches of 100

    if (fetchError) throw fetchError;

    if (!petitionsData || petitionsData.length === 0) {
      console.log('✅ No petitions need migration - all have images!');
      return { success: true, updated: 0, message: 'All petitions already have images' };
    }

    console.log(`📊 Found ${petitionsData.length} petitions without images`);

    let updatedCount = 0;
    const errors: Array<{ petitionId: string; error: string }> = [];

    // Update each petition with auto-generated image
    for (const petition of petitionsData) {
      try {
        const imageUrl = getRandomCategoryImage(petition.category || 'other');

        const { error: updateError } = await supabase
          .from('petitions')
          .update({
            image_url: imageUrl,
            is_auto_image: true,
          })
          .eq('id', petition.id);

        if (updateError) {
          errors.push({
            petitionId: petition.id,
            error: updateError.message,
          });
          console.error(`❌ Error updating petition ${petition.id}:`, updateError);
        } else {
          updatedCount++;
          console.log(`✅ Updated petition ${petition.id} with ${petition.category} image`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push({
          petitionId: petition.id,
          error: errorMsg,
        });
        console.error(`❌ Error processing petition ${petition.id}:`, error);
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`📈 Updated ${updatedCount} petitions`);
    if (errors.length > 0) {
      console.log(`⚠️ Failed to update ${errors.length} petitions`);
      console.log('Errors:', errors);
    }

    return {
      success: true,
      updated: updatedCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully updated ${updatedCount} petitions. ${
        errors.length > 0 ? `${errors.length} failed.` : 'All petitions updated!'
      }`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('❌ Migration failed:', errorMsg);
    return {
      success: false,
      updated: 0,
      error: errorMsg,
      message: `Migration failed: ${errorMsg}`,
    };
  }
};

/**
 * Alternative: Batch migration for large datasets
 * Process petitions in chunks of specified size
 */
export const migrateExistingPetitionsInBatches = async (batchSize = 50) => {
  try {
    console.log(`🔄 Starting batch migration (batch size: ${batchSize})...`);

    let totalUpdated = 0;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const { data: batch, error: fetchError } = await supabase
        .from('petitions')
        .select('id, category, image_url')
        .or('image_url.is.null,image_url.eq.""')
        .range(offset, offset + batchSize - 1);

      if (fetchError) throw fetchError;

      if (!batch || batch.length === 0) {
        hasMore = false;
        break;
      }

      for (const petition of batch) {
        try {
          const imageUrl = getRandomCategoryImage(petition.category || 'other');

          await supabase
            .from('petitions')
            .update({
              image_url: imageUrl,
              is_auto_image: true,
            })
            .eq('id', petition.id);

          totalUpdated++;
        } catch (error) {
          console.error(`Error updating petition ${petition.id}:`, error);
        }

        await new Promise(resolve => setTimeout(resolve, 50));
      }

      offset += batchSize;
      console.log(`📊 Processed ${totalUpdated} petitions...`);
    }

    console.log(`✅ Batch migration complete! Updated ${totalUpdated} petitions`);
    return { success: true, updated: totalUpdated };
  } catch (error) {
    console.error('❌ Batch migration failed:', error);
    return { success: false, error };
  }
};
