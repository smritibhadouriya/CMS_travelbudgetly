// //linkUtils.js
// export const isTextAlreadyLinked = (value, selectionStart, selectionEnd) => {
//   const beforeText = value.substring(0, selectionStart);
//   const afterText = value.substring(selectionEnd);

//   const lastOpenTag = beforeText.lastIndexOf("<a ");
//   const lastCloseTag = beforeText.lastIndexOf("</a>");

//   // If <a> appears after last </a>, then we are inside link
//   return lastOpenTag > lastCloseTag;
// };

// export const insertLink = (value, selectionStart, selectionEnd, url) => {
//   const selectedText = value.substring(selectionStart, selectionEnd);

//   return (
//     value.substring(0, selectionStart) +
//     `<a href="${url}">${selectedText}</a>` +
//     value.substring(selectionEnd)
//   );
// };


// utils/linkUtils.js
export const isTextAlreadyLinked = (value, selectionStart, selectionEnd) => {
  const beforeText = value.substring(0, selectionStart);
  const lastOpenTag  = beforeText.lastIndexOf("<a ");
  const lastCloseTag = beforeText.lastIndexOf("</a>");
  return lastOpenTag > lastCloseTag;
};

export const insertLink = (value, selectionStart, selectionEnd, url) => {
  const selectedText = value.substring(selectionStart, selectionEnd);
  return (
    value.substring(0, selectionStart) +
    `<a href="${url}" target="_blank" rel="noopener noreferrer">${selectedText}</a>` +
    value.substring(selectionEnd)
  );
};