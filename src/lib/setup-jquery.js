// Sets the global jQuery BEFORE Summernote is imported (Summernote's UMD
// build looks for window.jQuery at load time). This module must be imported
// before 'summernote/dist/summernote-lite.js'.
import $ from 'jquery';

if (typeof window !== 'undefined') {
  window.$ = window.jQuery = $;
}

export default $;
