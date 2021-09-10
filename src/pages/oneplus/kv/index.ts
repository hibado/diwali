import './index.styl';
import NativeShare from 'nativeshare';
import { oneFinishLoading } from '@/common/js/utils/oneplus';
import { query, scrollIntoView } from '@/common/js/dom';
import { disableLazyload, enableLazyload } from '@/common/js/lazyload';

/**
 * 经常会用到的 KV 模式：
 * 1. 禁用全局的图片/视频加载
 * 2. 手动加载 KV 资源
 * 2.5 加载 KV 资源的同时执行 js 初始化操作
 * 3. js 初始化完成，等待 KV 资源加载完成或超时，执行 KV 入场动效——有时候并没有动效，则什么也不用执行
 * 4. KV 入场动效结束后才允许全局的资源加载——防止 lazyload 代码使得 KV 动效卡顿
 * 4.5 在 KV 动效完成前，KV 元素滚动到一半以上在 viewport 外时也需要允许全局的资源加载——避免后续页面图片等资源加载过晚
 */
export function initKv() {
  const root = query(document, '#section-kv');
  // disableLazyload();

  // 这里是一个固定的定时器，实际上常常是 KV 的资源加载（带 timeout 的 loadElements）
  // const imagesLoaded = new Promise((resolve) => {
  //   window.setTimeout(resolve, 2000);
  // });
  // const nativeShare = new NativeShare();
  // nativeShare.setShareData({
  //   title: 'NativeShare',
  //   desc: 'NativeShare是一个整合了各大移动端浏览器调用原生分享的插件',
  //   // 如果是微信该link的域名必须要在微信后台配置的安全域名之内的。
  //   link: 'https://github.com/fa-ge/NativeShare',
  //   icon: 'https://pic3.zhimg.com/v2-080267af84aa0e97c66d5f12e311c3d6_xl.jpg',
  //   // 不要过于依赖以下两个回调，很多浏览器是不支持的
  //   success() {
  //     alert('success');
  //   },
  //   fail() {
  //     alert('fail');
  //   },
  // });

  return {
    // show: () => {
    //   return imagesLoaded.then(() => {
    //     // enableLazyload();
    //     // oneFinishLoading();
    //     // 在 oneFinishLoading 之后 scroll 才会生效
    //     // query(root!, 'button')?.addEventListener('click', () => {
    //     //   try {
    //     //     nativeShare.call('wechatFriend');
    //     //   } catch (error) {
    //     //     alert(error);
    //     //   }
    //     // });
    //   });
    // },
  };
}
