/**
 * Production-safe date range filtering for UTC databases
 * Handles timezone mismatches between JavaScript and PostgreSQL
 */

/**
 * Get UTC date range for filtering
 * @param {string} range - Time range: 'today', 'last7', 'last30', 'all'
 * @returns {Object} Date range object for Prisma queries
 */
export const getDateRangeUTC = (range) => {
  if (!range || range === 'all') {
    return {};
  }

  // Always work with UTC dates
  const now = new Date();
  const utcNow = new Date(now.getTime() + (now.getTimezoneOffset() * 60000));
  
  console.log(`=== DATE FILTER DEBUG ===`);
  console.log(`Local now: ${now.toISOString()}`);
  console.log(`UTC now: ${utcNow.toISOString()}`);
  console.log(`Timezone offset: ${now.getTimezoneOffset()} minutes`);

  switch (range) {
    case 'today': {
      // Get start of today in UTC
      const startOfTodayUTC = new Date(utcNow);
      startOfTodayUTC.setUTCHours(0, 0, 0, 0);
      
      // Get end of today in UTC
      const endOfTodayUTC = new Date(utcNow);
      endOfTodayUTC.setUTCHours(23, 59, 59, 999);
      
      console.log(`Today filter (UTC):`);
      console.log(`  Start: ${startOfTodayUTC.toISOString()}`);
      console.log(`  End: ${endOfTodayUTC.toISOString()}`);
      
      return {
        gte: startOfTodayUTC,
        lte: endOfTodayUTC
      };
    }
    
    case 'last7': {
      const sevenDaysAgoUTC = new Date(utcNow);
      sevenDaysAgoUTC.setUTCDate(sevenDaysAgoUTC.getUTCDate() - 7);
      sevenDaysAgoUTC.setUTCHours(0, 0, 0, 0);
      
      console.log(`Last 7 days filter (UTC):`);
      console.log(`  From: ${sevenDaysAgoUTC.toISOString()}`);
      
      return { gte: sevenDaysAgoUTC };
    }
    
    case 'last30': {
      const thirtyDaysAgoUTC = new Date(utcNow);
      thirtyDaysAgoUTC.setUTCDate(thirtyDaysAgoUTC.getUTCDate() - 30);
      thirtyDaysAgoUTC.setUTCHours(0, 0, 0, 0);
      
      console.log(`Last 30 days filter (UTC):`);
      console.log(`  From: ${thirtyDaysAgoUTC.toISOString()}`);
      
      return { gte: thirtyDaysAgoUTC };
    }
    
    default:
      console.log(`Unknown range: ${range}, returning empty filter`);
      return {};
  }
};

/**
 * Alternative: Local timezone filtering (if you want local time)
 * Use this only if your business logic requires local time
 */
export const getDateRangeLocal = (range) => {
  if (!range || range === 'all') {
    return {};
  }

  const now = new Date();
  
  switch (range) {
    case 'today': {
      // Get start of today in local time, then convert to UTC
      const startOfTodayLocal = new Date(now);
      startOfTodayLocal.setHours(0, 0, 0, 0);
      
      const endOfTodayLocal = new Date(now);
      endOfTodayLocal.setHours(23, 59, 59, 999);
      
      console.log(`Today filter (Local → UTC):`);
      console.log(`  Local start: ${startOfTodayLocal.toString()}`);
      console.log(`  Local end: ${endOfTodayLocal.toString()}`);
      console.log(`  UTC start: ${startOfTodayLocal.toISOString()}`);
      console.log(`  UTC end: ${endOfTodayLocal.toISOString()}`);
      
      return {
        gte: startOfTodayLocal,
        lte: endOfTodayLocal
      };
    }
    
    case 'last7': {
      const sevenDaysAgoLocal = new Date(now);
      sevenDaysAgoLocal.setDate(sevenDaysAgoLocal.getDate() - 7);
      sevenDaysAgoLocal.setHours(0, 0, 0, 0);
      
      return { gte: sevenDaysAgoLocal };
    }
    
    case 'last30': {
      const thirtyDaysAgoLocal = new Date(now);
      thirtyDaysAgoLocal.setDate(thirtyDaysAgoLocal.getDate() - 30);
      thirtyDaysAgoLocal.setHours(0, 0, 0, 0);
      
      return { gte: thirtyDaysAgoLocal };
    }
    
    default:
      return {};
  }
};

/**
 * Test function to verify timezone handling
 */
export const testTimezoneHandling = () => {
  console.log('=== TIMEZONE TESTING ===');
  
  const now = new Date();
  console.log(`Current local time: ${now.toString()}`);
  console.log(`Current UTC time: ${now.toISOString()}`);
  console.log(`Timezone offset: ${now.getTimezoneOffset()} minutes`);
  
  // Test UTC filter
  const utcToday = getDateRangeUTC('today');
  console.log('UTC Today filter:', utcToday);
  
  // Test local filter
  const localToday = getDateRangeLocal('today');
  console.log('Local Today filter:', localToday);
  
  return { utcToday, localToday };
};
