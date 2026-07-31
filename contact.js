const API_URL = 'https://your-backend-url.onrender.com';

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
                contactForm.style.display = 'none';
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';
            } else {
                contactForm.style.display = 'none';
                successMessage.style.display = 'none';
                errorMessage.style.display = 'block';
            }
        } catch (error) {
            console.error('Error sending message:', error);
            contactForm.style.display = 'none';
            successMessage.style.display = 'none';
            errorMessage.style.display = 'block';
        }
    });
});
