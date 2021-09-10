declare const __DEV__: boolean; // NODE_ENV=development
declare const __LANG__: 'zh' | 'en' | string;
declare const __ZH__: boolean;
declare const __EN__: boolean;
declare const __OPPO__: boolean; // vender/ 下存在 oppo/ 文件夹
declare const __ONEPLUS__: boolean; // vender/ 下仅存在 oneplus/ 文件夹
declare const __AEM___: boolean; // yarn build:prod 时为 true，即 yarn build --env.AEM
declare const __PAGE__: string; // 选中的 page

declare const __GTM_PRODUCT__: string; // 详见 .env.yaml 说明
declare const __GTM_CATEGORY__: `${'Event' | 'Product'} Details`; // 详见 .env.yaml 说明
