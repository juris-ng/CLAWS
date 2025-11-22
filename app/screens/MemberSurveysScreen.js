import { useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BodyMemberService } from '../../utils/bodyMemberService';


const MemberSurveysScreen = ({ route, navigation }) => {
  const { bodyId } = route.params;


  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);


  useEffect(() => {
    loadSurveys();
  }, [bodyId]);


  const loadSurveys = async () => {
    try {
      const result = await BodyMemberService.getSurveys(bodyId, 'active');
      if (result.success) {
        setSurveys(result.surveys);
      }
    } catch (error) {
      console.error('Error loading surveys:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadSurveys();
  };


  const getSurveyTypeIcon = (type) => {
    switch (type) {
      case 'feedback': return '💬';
      case 'opinion': return '🗳️';
      case 'satisfaction': return '⭐';
      case 'needs_assessment': return '📊';
      default: return '📋';
    }
  };


  const isExpiringSoon = (endDate) => {
    if (!endDate) return false;
    const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0;
  };


  const renderSurvey = ({ item }) => {
    const typeIcon = getSurveyTypeIcon(item.survey_type);
    const expiring = isExpiringSoon(item.end_date);


    return (
      <TouchableOpacity
        style={styles.surveyCard}
        onPress={() => navigation.navigate('TakeSurvey', { 
          surveyId: item.id,
          bodyId 
        })}
      >
        <View style={styles.surveyHeader}>
          <Text style={styles.typeIcon}>{typeIcon}</Text>
          <View style={styles.surveyInfo}>
            <Text style={styles.surveyTitle}>{item.title}</Text>
            <Text style={styles.surveyType}>
              {item.survey_type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
        </View>


        {item.description && (
          <Text style={styles.surveyDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}


        <View style={styles.surveyFooter}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statText}>
                {item.responses_count || 0} responses
              </Text>
            </View>
            {item.is_anonymous && (
              <View style={styles.anonymousBadge}>
                <Text style={styles.anonymousText}>🔒 Anonymous</Text>
              </View>
            )}
          </View>


          {item.end_date && (
            <View style={styles.dateRow}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={[styles.dateText, expiring && styles.expiringText]}>
                {expiring ? '⚠️ ' : ''}
                Ends: {new Date(item.end_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>


        {item.body && (
          <View style={styles.bodyInfo}>
            <Text style={styles.bodyLabel}>By:</Text>
            <Text style={styles.bodyName}>{item.body.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      <View style={styles.container}>
        <FlatList
          data={surveys}
          renderItem={renderSurvey}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Active Surveys</Text>
              <Text style={styles.headerSubtitle}>
                Your feedback helps organizations improve
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No active surveys</Text>
              <Text style={styles.emptySubtext}>
                Check back later for surveys from organizations
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  surveyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  surveyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  surveyInfo: {
    flex: 1,
  },
  surveyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  surveyType: {
    fontSize: 12,
    color: '#0066FF',
    fontWeight: '600',
  },
  surveyDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
  surveyFooter: {
    gap: 8,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  statText: {
    fontSize: 13,
    color: '#666666',
  },
  anonymousBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  anonymousText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#666666',
  },
  expiringText: {
    color: '#FF9800',
    fontWeight: '600',
  },
  bodyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bodyLabel: {
    fontSize: 13,
    color: '#999999',
    marginRight: 6,
  },
  bodyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
});


export default MemberSurveysScreen;
