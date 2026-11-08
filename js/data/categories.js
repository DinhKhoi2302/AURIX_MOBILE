/**
 * TechPhone — Categories Data Module
 * Matches left sidebar & tabs in homepage reference image_7c1303.png
 */
(function (global) {
  'use strict';
  const TP = (global.TechPhone = global.TechPhone || {});

  TP.CATEGORIES = [
    {
      id: 'smartphone',
      name: 'Điện thoại hãng',
      shortName: 'Điện thoại',
      icon: 'assets/icons/categories/smartphone.svg',
      badge: 'Hot',
      description: 'Flagship iPhone, Samsung Galaxy, Xiaomi, OPPO, Vivo, Google Pixel chính hãng VN/A.',
      brands: ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Vivo', 'Google']
    },
    {
      id: 'accessory',
      name: 'Phụ kiện',
      shortName: 'Phụ kiện',
      icon: 'assets/icons/categories/headphones.svg',
      badge: '-50%',
      description: 'Tai nghe, củ cáp sạc nhanh GaN, ốp lưng MagSafe, kính cường lực chính hãng.',
      brands: ['Apple', 'Anker', 'Sony', 'Samsung']
    },
    {
      id: 'tablet',
      name: 'Máy tính bảng',
      shortName: 'Máy tính bảng',
      icon: 'assets/icons/categories/tablet.svg',
      badge: 'Mới',
      description: 'iPad Pro M4, Samsung Galaxy Tab S9 Ultra phục vụ học tập, thiết kế và làm việc.',
      brands: ['Apple', 'Samsung', 'Xiaomi']
    },
    {
      id: 'smartwatch',
      name: 'Đồng hồ thông minh',
      shortName: 'Đồng hồ',
      icon: 'assets/icons/categories/watch.svg',
      badge: '',
      description: 'Apple Watch Ultra 2, Xiaomi Watch S3 theo dõi sức khỏe, thể thao chuyên nghiệp.',
      brands: ['Apple', 'Samsung', 'Xiaomi']
    },
    {
      id: 'audio',
      name: 'Tai nghe - Âm thanh',
      shortName: 'Âm thanh',
      icon: 'assets/icons/categories/headphones.svg',
      badge: '',
      description: 'AirPods Pro 2, Sony WF-1000XM5 chống ồn chủ động ANC đỉnh cao.',
      brands: ['Apple', 'Sony']
    },
    {
      id: 'powerbank',
      name: 'Sạc dự phòng',
      shortName: 'Sạc dự phòng',
      icon: 'assets/icons/categories/battery.svg',
      badge: '',
      description: 'Pin dự phòng Anker Prime 200W dung lượng cao, an toàn bay quốc tế.',
      brands: ['Anker', 'Xiaomi']
    },
    {
      id: 'case',
      name: 'Ốp lưng - Bao da',
      shortName: 'Ốp lưng',
      icon: 'assets/icons/categories/case.svg',
      badge: '',
      description: 'Ốp lưng MagSafe chống sốc, bao da cao cấp cho iPhone và Galaxy.',
      brands: ['Apple', 'Samsung']
    }
  ];
})(window);
