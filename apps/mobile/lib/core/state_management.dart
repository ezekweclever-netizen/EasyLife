import 'package:flutter/foundation.dart';

/// ============================================================================
/// STATE MANAGEMENT ARCHITECTURE: REACTIVE CONTROLLER PATTERN
/// ============================================================================
///
/// DESIGN DECISION & DOCUMENTATION:
/// For the EasyLife Flutter application, we implement Flutter's official
/// `ChangeNotifier` and `ListenableBuilder` reactive controller pattern.
///
/// KEY RATIONALE:
/// 1. Built-in SDK Stability: Native to Flutter, guaranteeing zero third-party
///    breakage, zero dependency conflicts, and seamless Dart 3.x interoperability.
/// 2. Deterministic Reactivity: ViewModels/Controllers notify listeners on
///    state transitions, allowing targeted sub-tree rebuilds via `ListenableBuilder`.
/// 3. Service & Repository Separation: Clean separation of concerns where UI
///    screens communicate exclusively with Repositories and State Notifiers.
/// 4. Hot Reload Continuity: Preserves active Flutter VM development sessions
///    without breaking plugin channels during live updates on running emulators.
/// 5. Testability: Controllers can be instantiated and unit-tested in isolation
///    without mounting mock widget trees or mocking complex dependency injection bags.
///
/// ============================================================================

/// Base Controller class providing reactive state notifications
abstract class BaseController extends ChangeNotifier {
  bool _isLoading = false;
  String? _errorMessage;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasError => _errorMessage != null;

  @protected
  void setLoading(bool loading) {
    if (_isLoading != loading) {
      _isLoading = loading;
      notifyListeners();
    }
  }

  @protected
  void setError(String? message) {
    _errorMessage = message;
    notifyListeners();
  }

  @protected
  void clearError() {
    if (_errorMessage != null) {
      _errorMessage = null;
      notifyListeners();
    }
  }
}

/// Generic Async State container for UI consumption
class AsyncState<T> {
  final T? data;
  final bool isLoading;
  final String? error;

  const AsyncState({
    this.data,
    this.isLoading = false,
    this.error,
  });

  factory AsyncState.initial([T? data]) => AsyncState(data: data);
  factory AsyncState.loading([T? data]) => AsyncState(data: data, isLoading: true);
  factory AsyncState.success(T data) => AsyncState(data: data);
  factory AsyncState.failure(String error, [T? data]) => AsyncState(data: data, error: error);

  bool get hasData => data != null;
  bool get hasError => error != null;
}
