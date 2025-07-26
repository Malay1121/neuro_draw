export const exportCanvasAsPNG = (): void => {
  const canvas = document.querySelector('canvas');
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  try {
    // Create a link element to trigger download
    const link = document.createElement('a');
    link.download = `neurodraw-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('Neural artwork exported successfully!');
  } catch (error) {
    console.error('Error exporting canvas:', error);
  }
};