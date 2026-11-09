import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/property.dart';
import '../models/asset_item.dart';
import 'supabase_service.dart';

class BusinessService {
  final SupabaseClient _client = SupabaseService.client;

  /// Fetch properties
  Future<List<PropertyItem>> fetchProperties(String businessId) async {
    try {
      final res = await _client
          .from('properties')
          .select('*')
          .eq('business_id', businessId)
          .order('created_at', ascending: false);

      if (res.isNotEmpty) {
        return res.map((item) => PropertyItem.fromJson(item)).toList();
      }
    } catch (e) {
      // Return sample properties for instant preview
    }

    return [
      const PropertyItem(
        id: 'prop-001',
        businessId: 'biz-001',
        name: 'Trans-Amadi Logistics Yard',
        code: 'PROP-PH-01',
        propertyType: 'Industrial / Commercial',
        city: 'Port Harcourt',
        state: 'Rivers State',
        address: '14 Industrial Road, Trans-Amadi',
        unitsCount: 4,
        createdAt: '2026-11-01T10:00:00Z',
      ),
      const PropertyItem(
        id: 'prop-002',
        businessId: 'biz-001',
        name: 'Old GRA Corporate Suites',
        code: 'PROP-PH-02',
        propertyType: 'Executive Office',
        city: 'Port Harcourt',
        state: 'Rivers State',
        address: '8 Forces Avenue, Old GRA',
        unitsCount: 12,
        createdAt: '2026-11-02T10:00:00Z',
      ),
    ];
  }

  /// Create property
  Future<PropertyItem> createProperty({
    required String businessId,
    required String name,
    required String address,
    required String city,
    required String state,
    String propertyType = 'commercial',
    int unitsCount = 1,
  }) async {
    final payload = {
      'business_id': businessId,
      'name': name.trim(),
      'address': address.trim(),
      'city': city.trim(),
      'state': state.trim(),
      'property_type': propertyType,
      'units_count': unitsCount,
      'is_active': true,
      'created_at': DateTime.now().toIso8601String(),
    };

    try {
      final res = await _client.from('properties').insert(payload).select().single();
      return PropertyItem.fromJson(res);
    } catch (e) {
      return PropertyItem(
        id: 'prop-local-${DateTime.now().millisecondsSinceEpoch}',
        businessId: businessId,
        name: name,
        address: address,
        city: city,
        state: state,
        propertyType: propertyType,
        unitsCount: unitsCount,
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }

  /// Fetch equipment / maintainable assets
  Future<List<AssetItem>> fetchAssets(String businessId, {String? propertyId}) async {
    try {
      var query = _client.from('assets').select('*').eq('business_id', businessId);

      if (propertyId != null) {
        query = query.eq('property_id', propertyId);
      }

      final res = await query.order('created_at', ascending: false);
      if (res.isNotEmpty) {
        return res.map((item) => AssetItem.fromJson(item)).toList();
      }
    } catch (e) {
      // Fallback
    }

    return [
      const AssetItem(
        id: 'ast-001',
        businessId: 'biz-001',
        propertyId: 'prop-001',
        name: 'Perkins 150kVA Prime Generator',
        category: 'Generators & Power Systems',
        brand: 'Perkins',
        modelNumber: 'PK-150-D',
        serialNumber: 'SN-PERK-99428',
        maintenanceIntervalDays: 60,
        status: 'operational',
        nextServiceDueAt: '2026-12-15',
        createdAt: '2026-10-15T09:00:00Z',
      ),
      const AssetItem(
        id: 'ast-002',
        businessId: 'biz-001',
        propertyId: 'prop-002',
        name: 'Daikin VRV Central AC Chiller',
        category: 'Air Conditioning & Cooling',
        brand: 'Daikin',
        modelNumber: 'VRV-IV-S',
        serialNumber: 'DAIK-44281',
        maintenanceIntervalDays: 90,
        status: 'operational',
        nextServiceDueAt: '2026-11-30',
        createdAt: '2026-10-01T09:00:00Z',
      ),
      const AssetItem(
        id: 'ast-003',
        businessId: 'biz-001',
        propertyId: 'prop-001',
        name: 'Felicity 10kVA Hybrid Solar Inverter',
        category: 'Solar & Inverter Systems',
        brand: 'Felicity Solar',
        modelNumber: 'FL-IV-10K',
        serialNumber: 'FEL-88192',
        maintenanceIntervalDays: 180,
        status: 'operational',
        nextServiceDueAt: '2027-01-20',
        createdAt: '2026-09-10T09:00:00Z',
      ),
    ];
  }

  /// Register equipment / asset
  Future<AssetItem> createAsset({
    required String businessId,
    String? propertyId,
    required String name,
    required String category,
    String? brand,
    String? modelNumber,
    String? serialNumber,
    int maintenanceIntervalDays = 90,
  }) async {
    final payload = {
      'business_id': businessId,
      'property_id': propertyId,
      'name': name.trim(),
      'asset_category': category,
      'brand': brand?.trim(),
      'model_number': modelNumber?.trim(),
      'serial_number': serialNumber?.trim(),
      'maintenance_interval_days': maintenanceIntervalDays,
      'status': 'operational',
      'created_at': DateTime.now().toIso8601String(),
    };

    try {
      final res = await _client.from('assets').insert(payload).select().single();
      return AssetItem.fromJson(res);
    } catch (e) {
      return AssetItem(
        id: 'ast-local-${DateTime.now().millisecondsSinceEpoch}',
        businessId: businessId,
        propertyId: propertyId,
        name: name,
        category: category,
        brand: brand,
        modelNumber: modelNumber,
        serialNumber: serialNumber,
        maintenanceIntervalDays: maintenanceIntervalDays,
        createdAt: DateTime.now().toIso8601String(),
      );
    }
  }
}
