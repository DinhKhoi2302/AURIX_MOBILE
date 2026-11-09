/**
 * AURIX MOBILE — Seed Member Account Data
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.AURIX = global.TechPhone || {});

  TP.hashDemoSecret = function (plainText) {
    let h = 2166136261;
    const str = 'AURIX_SALT_2026::' + String(plainText || '');
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return 'tp_fnv1a_' + (h >>> 0).toString(16);
  };

  TP.DEMO_USERS = [
    {
      id: 'usr-default-01',
      username: 'truongdinhkhoi',
      email: 'truongdinhkhoi123@gmail.com',
      phone: '0941054053',
      fullName: 'Trương Đình Khôi',
      role: 'Thành viên AURIX Member',
      passwordDigest: TP.hashDemoSecret('Dinhkhoi99@'),
      createdAt: '2026-01-15T08:00:00.000Z'
    }
  ];
})(window);
