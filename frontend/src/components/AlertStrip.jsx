import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api.js';

const AlertStrip = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await api.get('/alerts/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch alert stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats || stats.active === 0) {
    return null;
  }

  const getAlertMessage = () => {
    const parts = [];
    
    if (stats.byType?.OUT_OF_STOCK?.active > 0) {
      parts.push(`${stats.byType.OUT_OF_STOCK.active} Out of Stock`);
    }
    if (stats.byType?.CRITICAL?.active > 0) {
      parts.push(`${stats.byType.CRITICAL.active} Critical`);
    }
    if (stats.byType?.LOW_STOCK?.active > 0) {
      parts.push(`${stats.byType.LOW_STOCK.active} Low Stock`);
    }
    if (stats.byType?.DEMAND_SPIKE?.active > 0) {
      parts.push(`${stats.byType.DEMAND_SPIKE.active} Demand Spike`);
    }

    return parts.join(' • ');
  };

  const getSeverityColor = () => {
    if (stats.bySeverity?.HIGH > 0) {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (stats.bySeverity?.MEDIUM > 0) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const getIcon = () => {
    if (stats.bySeverity?.HIGH > 0) {
      return '🔥';
    }
    if (stats.bySeverity?.MEDIUM > 0) {
      return '⚠️';
    }
    return '📢';
  };

  return (
    <div className={`${getSeverityColor()} border px-4 py-3 rounded-lg mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{getIcon()}</span>
          <div>
            <p className="font-medium">
              {getAlertMessage()}
            </p>
            <p className="text-sm opacity-75">
              {stats.active} active alert{stats.active !== 1 ? 's' : ''} require attention
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            to="/admin/alerts"
            className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded text-sm font-medium transition"
          >
            View Alerts
          </Link>
          <button
            onClick={() => setVisible(false)}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertStrip;
