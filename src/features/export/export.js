export const downloadCanvas = (canvas, name) =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = name;
      link.click();
      URL.revokeObjectURL(link.href);
      resolve();
    }, 'image/png');
  });
