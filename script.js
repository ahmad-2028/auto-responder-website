const API_URL = '';
const APK_URL = 'downloads/autoresponder.apk';

document.addEventListener('DOMContentLoaded', () => {
    const downloadButtons = document.querySelectorAll('#downloadBtn, #downloadBtn2');

    downloadButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();

            // Track the download so it shows up in the admin dashboard
            try {
                await fetch(`${API_URL}/api/download`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Error tracking download:', error);
            }

            // Actually start the APK download
            const a = document.createElement('a');
            a.href = APK_URL;
            a.download = 'AutoResponder.apk';
            a.rel = 'noopener';
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    });
});
