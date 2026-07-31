const API_URL = '';

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await fetch(`${API_URL}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                contactForm.reset(); // clear the fields for the next message

                const summaryEl = document.getElementById('successSummary');
                if (summaryEl) {
                    summaryEl.innerHTML =
                        '<strong>Subject:</strong> ' + escapeHtml(formData.subject) +
                        '<br><strong>Message:</strong> ' + escapeHtml(formData.message);
                    summaryEl.style.display = 'block';
                }

                // Keep the (now empty) form visible so you can write another message
                contactForm.style.display = '';
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';

                // Auto-hide the success note after a few seconds
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 6000);
            } else {
                successMessage.style.display = 'none';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error sending message:', error);
            successMessage.style.display = 'none';
            errorMessage.style.display = 'block';
        }
    });
});

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
