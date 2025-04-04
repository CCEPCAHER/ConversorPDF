let pdfDocument = null;
let currentBaseName = 'documento';

document.getElementById('processBtn').addEventListener('click', processPDF);
document.getElementById('baseName').addEventListener('input', (e) => {
    currentBaseName = e.target.value.replace(/[^a-zA-Z0-9]/g, '_');
});

async function processPDF() {
    const file = document.getElementById('pdfInput').files[0];
    if (!file) return alert('Selecciona un PDF primero');
    
    const zip = new JSZip();
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        const pdfData = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        
        document.getElementById('status').textContent = `Procesando ${pdf.numPages} páginas...`;
        
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 }); // Escala 2x para mejor calidad
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
            
            // Convertir canvas a JPG
            const jpgData = canvas.toDataURL('image/jpeg', 0.9);
            const blob = await fetch(jpgData).then(res => res.blob());
            
            // Nombre automático con numeración
            zip.file(`${currentBaseName}_${i}.jpg`, blob);
        }
        
        // Generar ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `${currentBaseName}_imagenes.zip`;
        link.click();
        
        document.getElementById('status').textContent = `✅ ${pdf.numPages} imágenes generadas!`;
    };
    
    reader.readAsArrayBuffer(file);
}
