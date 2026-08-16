/* =========================================
   JARVIS WebOS - Boot Sequence & Voice
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {
    const bootScreen = document.getElementById("boot-screen");
    const bootLog = document.getElementById("boot-log");
    const progressFill = document.querySelector(".progress-fill");

    // JARVIS Boot Log Messages
    const bootMessages = [
        "INITIATING CORE PROTOCOLS...",
        "ESTABLISHING SECURE CONNECTION...",
        "LOADING HOLOGRAPHIC INTERFACE...",
        "CALIBRATING NEURAL NETWORK...",
        "BYPASSING SECURITY PROTOCOLS...",
        "ALL SYSTEMS NOMINAL."
    ];

    let step = 0;
    const totalSteps = bootMessages.length;

    // Simulate the loading process
    function updateBoot() {
        if (step < totalSteps) {
            bootLog.textContent = bootMessages[step];
            
            // Calculate progress bar width
            const percentage = ((step + 1) / totalSteps) * 100;
            progressFill.style.width = `${percentage}%`;
            
            step++;
            
            // Randomize delay slightly for a realistic "loading" feel
            const delay = Math.random() * 400 + 400; // 400ms to 800ms
            setTimeout(updateBoot, delay);
        } else {
            setTimeout(finishBoot, 500);
        }
    }

    // Text-to-Speech function
    function speakGreeting() {
        if ('speechSynthesis' in window) {
            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance("Welcome back Captain, all systems online.");
            
            // Make the voice sound slightly deeper and steady
            utterance.rate = 0.95; 
            utterance.pitch = 0.8; 
            
            // Attempt to find a suitable voice (varies by browser/OS)
            const voices = synth.getVoices();
            const preferredVoice = voices.find(v => 
                v.name.includes("Google UK English Male") || 
                v.name.includes("Microsoft Mark")
            );
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            
            synth.speak(utterance);
        } else {
            console.warn("Text-to-Speech not supported in this browser.");
        }
    }

    // Complete the boot sequence
    function finishBoot() {
        // Trigger the voice
        speakGreeting();

        // Fade out the boot screen
        bootScreen.style.opacity = "0";

        // Wait for CSS fade transition to finish, then remove from view and load popup
        setTimeout(() => {
            bootScreen.style.display = "none";
            loadPopup();
        }, 1000); 
    }

    // Load the custom popup HTML into the container
    function loadPopup() {
        fetch('popup.html')
            .then(response => response.text())
            .then(data => {
                const container = document.getElementById('popup-container');
                container.innerHTML = data;
                
                // If popup.html includes a script tag, we need to manually execute it
                const scripts = container.querySelectorAll('script');
                scripts.forEach(oldScript => {
                    const newScript = document.createElement('script');
                    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
                    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
                    oldScript.parentNode.replaceChild(newScript, oldScript);
                });
            })
            .catch(err => console.error("Popup failed to load: ", err));
    }

    // Start the sequence shortly after page loads
    setTimeout(updateBoot, 600);
});
