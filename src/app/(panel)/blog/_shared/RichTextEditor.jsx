'use client';

// CKEditor 5 (Classic) rich-text editor — replaces the old Summernote setup.
// CKEditor touches `document` at import time, so this module must only ever be
// loaded on the client. Callers import it via next/dynamic({ ssr: false }).
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Autoformat,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  RemoveFormat,
  Font,
  Highlight,
  Alignment,
  Link,
  AutoLink,
  LinkImage,
  List,
  Indent,
  IndentBlock,
  BlockQuote,
  HorizontalLine,
  Image,
  ImageCaption,
  ImageStyle,
  ImageToolbar,
  ImageResize,
  ImageInsert,
  ImageInsertViaUrl,
  AutoImage,
  PictureEditing,
  ImageUpload,
  Base64UploadAdapter,
  MediaEmbed,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  TableColumnResize,
  TableCaption,
  SourceEditing,
  PasteFromOffice,
  GeneralHtmlSupport,
} from 'ckeditor5';
import 'ckeditor5/ckeditor5.css';

export default function RichTextEditor({ value = '', onChange, placeholder }) {
  return (
    <div className="ck-blog-editor">
      <CKEditor
        editor={ClassicEditor}
        data={value}
        config={{
          // Free, open-source usage. No paid key needed for these features.
          licenseKey: 'GPL',
          placeholder: placeholder || 'Write your blog content here...',
          plugins: [
            Essentials, Autoformat, Paragraph, Heading,
            Bold, Italic, Underline, Strikethrough, RemoveFormat,
            Font, Highlight, Alignment,
            Link, AutoLink, LinkImage,
            List, Indent, IndentBlock, BlockQuote, HorizontalLine,
            Image, ImageCaption, ImageStyle, ImageToolbar, ImageResize,
            ImageInsert, ImageInsertViaUrl, AutoImage, PictureEditing,
            ImageUpload, Base64UploadAdapter,
            MediaEmbed,
            Table, TableToolbar, TableProperties, TableCellProperties,
            TableColumnResize, TableCaption,
            SourceEditing, PasteFromOffice, GeneralHtmlSupport,
          ],
          toolbar: {
            items: [
              'undo', 'redo', '|',
              'sourceEditing', '|',
              'heading', '|',
              'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor', '|',
              'bold', 'italic', 'underline', 'strikethrough', 'removeFormat', 'highlight', '|',
              'link', 'insertImage', 'insertTable', 'blockQuote', 'mediaEmbed', 'horizontalLine', '|',
              'alignment', '|',
              'bulletedList', 'numberedList', 'outdent', 'indent',
            ],
            shouldNotGroupWhenFull: true,
          },
          heading: {
            options: [
              { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
              { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
              { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
              { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
              { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
            ],
          },
          image: {
            toolbar: [
              'imageTextAlternative', 'toggleImageCaption', '|',
              'imageStyle:inline', 'imageStyle:wrapText', 'imageStyle:breakText', '|',
              'resizeImage',
            ],
            insert: { integrations: ['url', 'upload'] },
          },
          table: {
            contentToolbar: [
              'tableColumn', 'tableRow', 'mergeTableCells',
              'tableProperties', 'tableCellProperties',
            ],
          },
          link: {
            defaultProtocol: 'https://',
            addTargetToExternalLinks: true,
          },
          // Keep arbitrary inline HTML/styles/classes that authors paste in,
          // so blog content isn't silently stripped on edit.
          htmlSupport: {
            allow: [{ name: /.*/, attributes: true, classes: true, styles: true }],
          },
        }}
        onChange={(_evt, editor) => onChange?.(editor.getData())}
      />
    </div>
  );
}
