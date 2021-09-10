export function oneFinishLoading() {
  if (__ONEPLUS__) {
    if (typeof (window.bus && window.bus.$emit) === 'function') {
      window.bus.$emit('remove-loading');
    } else {
      const loading = document.getElementById('universal-loading-canvas');
      if (loading) {
        loading.parentNode?.removeChild(loading);
      }
      document.body.classList.remove('hide-body');
    }
    document.documentElement.style.overflow = 'unset';
  }
}
