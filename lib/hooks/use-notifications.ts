"use client"

import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@/lib/types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      // Backend not running or unreachable, preserve current state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const clearNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}`, { method: 'DELETE' });
    } catch (e) {
      // Ignored
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'PATCH' });
    } catch (e) {
      // Ignored
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, { method: 'POST' });
    } catch (e) {
      // Ignored
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'read'>) => {
    const tempId = `notif-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id: tempId,
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);

    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNotification)
      });
      if (res.ok) {
        const saved = await res.json();
        setNotifications(prev => prev.map(n => n.id === tempId ? saved : n));
      }
    } catch (e) {
      // Ignored
    }
  };

  const clearAllNotifications = async () => {
    setNotifications([]);
    try {
      await fetch(`${API_BASE_URL}/notifications`, { method: 'DELETE' });
    } catch (e) {
      // Ignored
    }
  };

  return {
    notifications,
    loading,
    refreshNotifications: fetchNotifications,
    clearNotification,
    clearAllNotifications,
    markAsRead,
    markAllAsRead,
    addNotification
  };
}