type OneEvent = 'remove-loading';

declare interface Window {
  dataLayer?: {
    push(obj: unknown): void;
  };
  lazySizes: any; // 只在 OPPO 环境中存在
  lazySizesConfig: any; // 只在 OPPO 环境中存在
  bus: { $emit(event: OneEvent): void }; // 只在 oneplus 环境中存在
}
