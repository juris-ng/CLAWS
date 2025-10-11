# Testing Checklist - Civic Engagement Platform

## Authentication Tests
- [ ] User can register with email and password
- [ ] User receives verification email
- [ ] User can login with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] User can logout successfully
- [ ] Password reset works correctly
- [ ] Session persists after app restart

## Profile Management
- [ ] User can view their profile
- [ ] User can edit profile information
- [ ] Profile changes are saved correctly
- [ ] Avatar/profile picture displays correctly
- [ ] Points and level display accurately
- [ ] Followers/following counts are correct

## Petition Features
- [ ] User can create a new petition
- [ ] Petition form validation works
- [ ] Petitions display correctly in feed
- [ ] User can view petition details
- [ ] Vote functionality works (vote/unvote)
- [ ] Comment functionality works
- [ ] Search petitions works correctly
- [ ] Filter by category works
- [ ] Pagination loads more petitions

## Social Features
- [ ] User can follow/unfollow other users
- [ ] Leaderboard displays correctly
- [ ] User rank shows accurately
- [ ] Share petition to social media works
- [ ] Copy link to clipboard works
- [ ] Followers list displays correctly
- [ ] Following list displays correctly

## Notifications
- [ ] Notifications display in notification screen
- [ ] Notification count badge updates
- [ ] Mark as read functionality works
- [ ] Push notifications are received (on device)
- [ ] Notification settings can be changed

## Admin Features (If Admin)
- [ ] Admin dashboard displays stats
- [ ] User management works
- [ ] Petition moderation works
- [ ] Reports management works
- [ ] Analytics display correctly
- [ ] Ban/unban users works

## Performance
- [ ] App loads within 3 seconds
- [ ] Images load efficiently
- [ ] Scrolling is smooth (60fps)
- [ ] No memory leaks
- [ ] App works well on slow network
- [ ] Offline mode works correctly

## Offline Mode
- [ ] App shows offline indicator
- [ ] Cached data displays when offline
- [ ] Actions queue when offline
- [ ] Sync works when back online

## UI/UX
- [ ] All screens display correctly on different screen sizes
- [ ] Navigation is intuitive
- [ ] Error messages are user-friendly
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] All buttons are accessible
- [ ] Haptic feedback works (on device)

## Security
- [ ] No sensitive data in logs
- [ ] API keys are secure
- [ ] User data is protected
- [ ] RLS policies work correctly
- [ ] Input validation prevents injection

## Edge Cases
- [ ] App handles no internet connection
- [ ] App handles slow network
- [ ] App handles server errors gracefully
- [ ] App handles empty data states
- [ ] App handles very long text inputs
- [ ] App handles rapid button taps

## Cross-Platform (iOS & Android)
- [ ] App works on iOS
- [ ] App works on Android
- [ ] Push notifications work on both platforms
- [ ] Navigation works on both platforms
- [ ] UI displays correctly on both platforms
