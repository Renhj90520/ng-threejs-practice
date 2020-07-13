export function download(content, fileName?) {
  const blob = new Blob([content]);
  const filename = fileName || 'data.json';
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    let link = document.createElement('a');

    link.href = URL.createObjectURL(blob);

    link.setAttribute('visibility', 'hidden');
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
