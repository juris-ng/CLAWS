import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getCategoryInfo } from '../utils/petitionCategoriesService';

interface PetitionCardProps {
  petition: {
    id: string;
    title: string;
    description: string;
    category: string;
    image_url: string;
    support_count: number;
    created_at: string;
    is_auto_image?: boolean;
  };
  onPress: () => void;
}

const PetitionCard: React.FC<PetitionCardProps> = ({ petition, onPress }) => {
  const categoryInfo = getCategoryInfo(petition.category);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: petition.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Category Badge */}
        <View
          style={[
            styles.categoryBadge,
            { backgroundColor: categoryInfo.color },
          ]}
        >
          <Ionicons name={categoryInfo.icon as any} size={16} color="#FFFFFF" />
          <Text style={styles.categoryText}>{categoryInfo.name}</Text>
        </View>

        {/* Auto-Image Indicator */}
        {petition.is_auto_image && (
          <View style={styles.autoImageBadge}>
            <Ionicons name="sparkles" size={12} color="#FFD700" />
          </View>
        )}

        {/* Status Badge */}
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>Active</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>
          {petition.title}
        </Text>

        {/* Description */}
        <Text style={styles.description} numberOfLines={2}>
          {petition.description}
        </Text>

        {/* Footer */}
        <View style={styles.footer}>
          {/* Support Count */}
          <View style={styles.supportContainer}>
            <Ionicons name="thumbs-up" size={16} color="#FF9800" />
            <Text style={styles.supportText}>
              {petition.support_count > 1000
                ? `${(petition.support_count / 1000).toFixed(1)}K`
                : petition.support_count}{' '}
              supports
            </Text>
          </View>

          {/* Date */}
          <Text style={styles.date}>
            {new Date(petition.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {/* Right Arrow */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={24} color="#CCCCCC" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  autoImageBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  supportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  supportText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9800',
  },
  date: {
    fontSize: 11,
    color: '#999999',
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingRight: 8,
  },
});

export default PetitionCard;
