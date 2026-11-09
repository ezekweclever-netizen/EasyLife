/// EasyLife Mobile Core Constants
/// Matches web platform tokens and pilot configurations.
class AppConstants {
  AppConstants._();

  static const String appName = 'EasyLife';
  static const String tagline = 'Everyday Problems. Smarter Solutions.';
  static const String appVersion = '0.1.0';

  // Pilot Geography
  static const String defaultCity = 'Port Harcourt';
  static const String defaultState = 'Rivers State';
  static const List<String> supportedCities = [
    'Port Harcourt',
    'Lagos',
    'Abuja',
  ];

  static const List<String> portHarcourtAreas = [
    'Old GRA',
    'GRA Phase 1 & 2',
    'Peter Odili Road',
    'Trans-Amadi',
    'Rumuokoro',
    'D-Line',
    'Woji',
    'Choba',
    'Elelenwo',
    'Diobu',
    'Ada George',
    'Rumuola',
    'Eliozu',
  ];

  // Storage Buckets
  static const String bucketAvatars = 'avatars';
  static const String bucketPortfolio = 'portfolio-media';
  static const String bucketBookingAttachments = 'booking-attachments';
  static const String bucketVerificationDocs = 'verification-documents';
  static const String bucketMaintenanceInvoices = 'maintenance-invoices';
  static const String bucketDisputeEvidence = 'dispute-evidence';

  // Seed Categories (matches Supabase database)
  static const List<Map<String, String>> initialCategories = [
    {
      'id': '10000000-0000-4000-8000-000000000001',
      'name': 'Plumbing & Water Systems',
      'slug': 'plumbing-water-systems',
      'description': 'Leaks, pumps, tanks, piping, and fixtures',
      'icon': 'plumbing',
    },
    {
      'id': '10000000-0000-4000-8000-000000000002',
      'name': 'Electrical & Wiring',
      'slug': 'electrical-wiring',
      'description': 'Faults, circuit breakers, lighting, and surge protection',
      'icon': 'bolt',
    },
    {
      'id': '10000000-0000-4000-8000-000000000003',
      'name': 'Air Conditioning & Cooling',
      'slug': 'air-conditioning-cooling',
      'description': 'Gas refilling, compressor repair, and AC servicing',
      'icon': 'ac_unit',
    },
    {
      'id': '10000000-0000-4000-8000-000000000004',
      'name': 'Generators & Power Systems',
      'slug': 'generators-power-systems',
      'description': 'Diesel/petrol generator servicing, AVR, and starting faults',
      'icon': 'precision_manufacturing',
    },
    {
      'id': '10000000-0000-4000-8000-000000000005',
      'name': 'Solar & Inverter Systems',
      'slug': 'solar-inverter-systems',
      'description': 'Battery banks, solar panels, and hybrid inverter installations',
      'icon': 'solar_power',
    },
    {
      'id': '10000000-0000-4000-8000-000000000006',
      'name': 'Carpentry & Furniture',
      'slug': 'carpentry-furniture',
      'description': 'Door repairs, kitchen cabinets, locks, and custom woodwork',
      'icon': 'carpenter',
    },
    {
      'id': '10000000-0000-4000-8000-000000000007',
      'name': 'Painting & Wall Finishes',
      'slug': 'painting-wall-finishes',
      'description': 'Interior/exterior painting, screeding, and damp-proofing',
      'icon': 'format_paint',
    },
    {
      'id': '10000000-0000-4000-8000-000000000008',
      'name': 'Cleaning & Pest Control',
      'slug': 'cleaning-pest-control',
      'description': 'Post-construction cleaning, fumigation, and routine janitorial',
      'icon': 'pest_control',
    },
  ];
}
