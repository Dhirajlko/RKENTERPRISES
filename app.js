/**
 * R.K. Enterprises - AC Service & Repair (Lucknow)
 * Interactive Application Engine
 * Includes: Voice Input (STT), Audio Note Recorder (MediaRecorder), 
 * File/Photo Attachment, Geolocation Detection, Dynamic Pricing & WhatsApp Gateway.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. Mobile Menu Toggle
  // =========================================================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav = document.getElementById('mobileNav');

  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const isOpen = mobileNav.classList.contains('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile nav when clicking any link inside it
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // =========================================================================
  // 2. Dynamic Price Estimator & Service Selection
  // =========================================================================
  const serviceOptions = document.querySelectorAll('input[name="serviceType"]');
  const acTypeOptions = document.querySelectorAll('input[name="acType"]');
  const summaryAmount = document.getElementById('summaryAmount');
  const summaryServiceLabel = document.getElementById('summaryServiceLabel');
  const summaryAcLabel = document.getElementById('summaryAcLabel');

  const pricingRates = {
    'jet-wash': { name: 'Jet Pump Foam Wash', base: 499, splitMult: 1, windowMult: 0.85, cassetteMult: 1.6 },
    'repair': { name: 'AC Inspection & Repair', base: 299, splitMult: 1, windowMult: 1, cassetteMult: 1.5 },
    'gas-refill': { name: 'Gas Charging & Leak Test', base: 1499, splitMult: 1, windowMult: 0.9, cassetteMult: 1.4 },
    'installation': { name: 'AC Installation / Mount', base: 999, splitMult: 1, windowMult: 0.6, cassetteMult: 2.0 },
    'uninstallation': { name: 'AC Dismantling', base: 499, splitMult: 1, windowMult: 0.7, cassetteMult: 1.5 },
    'amc': { name: 'Annual Maintenance (AMC)', base: 1999, splitMult: 1, windowMult: 0.9, cassetteMult: 1.8 }
  };

  function updateEstimates() {
    const selectedService = document.querySelector('input[name="serviceType"]:checked')?.value || 'jet-wash';
    const selectedAcType = document.querySelector('input[name="acType"]:checked')?.value || 'split';

    const serviceData = pricingRates[selectedService] || pricingRates['jet-wash'];
    let multiplier = 1;
    let acName = 'Split AC';

    if (selectedAcType === 'window') {
      multiplier = serviceData.windowMult;
      acName = 'Window AC';
    } else if (selectedAcType === 'inverter') {
      multiplier = 1.05;
      acName = 'Inverter Split AC';
    } else if (selectedAcType === 'cassette') {
      multiplier = serviceData.cassetteMult;
      acName = 'Cassette / Commercial AC';
    }

    const totalEstimate = Math.round(serviceData.base * multiplier);

    if (summaryAmount) {
      summaryAmount.textContent = `₹${totalEstimate}`;
    }
    if (summaryServiceLabel) {
      summaryServiceLabel.textContent = serviceData.name;
    }
    if (summaryAcLabel) {
      summaryAcLabel.textContent = acName;
    }
  }

  serviceOptions.forEach(opt => opt.addEventListener('change', updateEstimates));
  acTypeOptions.forEach(opt => opt.addEventListener('change', updateEstimates));
  updateEstimates();

  // =========================================================================
  // 3. Voice Feature: Tab Switching (Live STT vs Audio Recorder)
  // =========================================================================
  const voiceTabBtns = document.querySelectorAll('.voice-tab-btn');
  const voicePanels = document.querySelectorAll('.voice-panel');

  voiceTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      voiceTabBtns.forEach(b => b.classList.remove('active'));
      voicePanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(btn.dataset.target);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // =========================================================================
  // 4. Voice Feature: Speech-To-Text (Web Speech API)
  // =========================================================================
  const sttBtn = document.getElementById('sttBtn');
  const sttStatus = document.getElementById('sttStatus');
  const sttLang = document.getElementById('sttLang');
  const problemDescription = document.getElementById('problemDescription');

  let recognition = null;
  let isRecognizing = false;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sttLang ? sttLang.value : 'hi-IN';

    if (sttLang) {
      sttLang.addEventListener('change', () => {
        if (recognition) {
          recognition.lang = sttLang.value;
        }
      });
    }

    recognition.onstart = () => {
      isRecognizing = true;
      sttBtn.classList.add('listening');
      sttBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
        <span>Listening... (Tap to Stop)</span>
      `;
      sttStatus.textContent = 'Listening to your voice... Speak your AC problem.';
      sttStatus.style.color = 'var(--danger)';
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript && problemDescription) {
        const currentVal = problemDescription.value.trim();
        problemDescription.value = currentVal ? `${currentVal} ${finalTranscript}` : finalTranscript;
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      sttStatus.textContent = `Mic notice: ${event.error === 'not-allowed' ? 'Permission denied. Please allow microphone.' : 'Try again or type your issue.'}`;
      stopRecognition();
    };

    recognition.onend = () => {
      stopRecognition();
    };

    function stopRecognition() {
      isRecognizing = false;
      sttBtn.classList.remove('listening');
      sttBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>
        <span>Tap to Speak / बोलें</span>
      `;
      sttStatus.textContent = 'Click microphone to transcribe in Hindi / English';
      sttStatus.style.color = 'var(--muted)';
    }

    sttBtn.addEventListener('click', () => {
      if (!isRecognizing) {
        try {
          recognition.lang = sttLang ? sttLang.value : 'hi-IN';
          recognition.start();
        } catch (err) {
          console.error(err);
        }
      } else {
        recognition.stop();
      }
    });
  } else {
    if (sttBtn) {
      sttBtn.title = 'Speech Recognition not supported in this browser. Please use the Voice Note tab or type below.';
      sttStatus.textContent = 'Live speech typing not supported in this browser. Please use the "Audio Voice Note" tab.';
    }
  }

  // Quick preset voice prompts
  document.querySelectorAll('.voice-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.dataset.text || chip.textContent.trim();
      if (problemDescription) {
        const current = problemDescription.value.trim();
        problemDescription.value = current ? `${current}, ${text}` : text;
        problemDescription.focus();
      }
    });
  });

  // =========================================================================
  // 5. Voice Feature: Audio Voice Message Recorder (MediaRecorder API)
  // =========================================================================
  const recordAudioBtn = document.getElementById('recordAudioBtn');
  const recorderTimer = document.getElementById('recorderTimer');
  const equalizerWave = document.getElementById('equalizerWave');
  const audioPreviewCard = document.getElementById('audioPreviewCard');
  const voiceAudioPlayer = document.getElementById('voiceAudioPlayer');
  const deleteAudioBtn = document.getElementById('deleteAudioBtn');

  let mediaRecorder = null;
  let audioChunks = [];
  let recordTimerInterval = null;
  let recordSeconds = 0;
  let recordedAudioBlob = null;

  if (recordAudioBtn) {
    recordAudioBtn.addEventListener('click', async () => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioChunks = [];
          mediaRecorder = new MediaRecorder(stream);

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              audioChunks.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(recordedAudioBlob);
            voiceAudioPlayer.src = audioUrl;
            audioPreviewCard.classList.add('show');

            // Stop all tracks to release mic
            stream.getTracks().forEach(track => track.stop());

            // Reset UI
            clearInterval(recordTimerInterval);
            recordAudioBtn.classList.remove('recording');
            recordAudioBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
              <span>Record New Note</span>
            `;
            equalizerWave.classList.remove('active');
          };

          mediaRecorder.start();
          recordSeconds = 0;
          recorderTimer.textContent = '00:00';
          recordTimerInterval = setInterval(() => {
            recordSeconds++;
            const mins = String(Math.floor(recordSeconds / 60)).padStart(2, '0');
            const secs = String(recordSeconds % 60).padStart(2, '0');
            recorderTimer.textContent = `${mins}:${secs}`;
            if (recordSeconds >= 120) { // 2 minute max limit
              mediaRecorder.stop();
            }
          }, 1000);

          recordAudioBtn.classList.add('recording');
          recordAudioBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
            <span>Stop Recording</span>
          `;
          equalizerWave.classList.add('active');

        } catch (err) {
          console.error('Microphone access error:', err);
          alert('Could not access microphone. Please grant microphone permission in your browser to record a voice message.');
        }
      } else if (mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    });
  }

  if (deleteAudioBtn) {
    deleteAudioBtn.addEventListener('click', () => {
      recordedAudioBlob = null;
      if (voiceAudioPlayer) {
        voiceAudioPlayer.src = '';
      }
      audioPreviewCard.classList.remove('show');
      recorderTimer.textContent = '00:00';
      recordAudioBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
        <span>Record Voice Note</span>
      `;
    });
  }

  // =========================================================================
  // 6. Attachment Feature: Photo & Video Uploader
  // =========================================================================
  const dropZone = document.getElementById('attachmentDropZone');
  const fileInput = document.getElementById('acFileInput');
  const previewsContainer = document.getElementById('attachmentPreviews');
  const imagePreviewModal = document.getElementById('imagePreviewModal');
  const modalEnlargedImg = document.getElementById('modalEnlargedImg');
  const closeImgModal = document.getElementById('closeImgModal');

  let attachedFiles = [];

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function renderPreviews() {
    previewsContainer.innerHTML = '';
    attachedFiles.forEach((file, index) => {
      const thumb = document.createElement('div');
      thumb.className = 'attachment-thumb';

      const isVideo = file.type.startsWith('video/');
      const previewEl = isVideo ? document.createElement('video') : document.createElement('img');
      previewEl.src = URL.createObjectURL(file);
      previewEl.alt = file.name;

      if (!isVideo) {
        previewEl.addEventListener('click', () => {
          modalEnlargedImg.src = previewEl.src;
          imagePreviewModal.classList.add('open');
        });
      }

      const nameEl = document.createElement('div');
      nameEl.className = 'file-name';
      nameEl.textContent = `${file.name} (${formatBytes(file.size)})`;

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-btn';
      removeBtn.innerHTML = '✕';
      removeBtn.title = 'Remove attachment';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        attachedFiles.splice(index, 1);
        renderPreviews();
      });

      thumb.appendChild(previewEl);
      thumb.appendChild(nameEl);
      thumb.appendChild(removeBtn);
      previewsContainer.appendChild(thumb);
    });
  }

  function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      if (!isImg && !isVid) {
        alert(`File "${file.name}" is not an image or video.`);
        return false;
      }
      if (file.size > 25 * 1024 * 1024) { // 25MB max
        alert(`File "${file.name}" exceeds 25MB limit.`);
        return false;
      }
      return true;
    });

    attachedFiles = [...attachedFiles, ...validFiles];
    renderPreviews();
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      handleFiles(e.target.files);
    });
  }

  if (dropZone) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files.length) {
        handleFiles(dt.files);
      }
    });
  }

  if (closeImgModal && imagePreviewModal) {
    closeImgModal.addEventListener('click', () => {
      imagePreviewModal.classList.remove('open');
    });
    imagePreviewModal.addEventListener('click', (e) => {
      if (e.target === imagePreviewModal) {
        imagePreviewModal.classList.remove('open');
      }
    });
  }

  // =========================================================================
  // 7. Location Attachment (Browser Geolocation API)
  // =========================================================================
  const detectLocationBtn = document.getElementById('detectLocationBtn');
  const customerAddress = document.getElementById('customerAddress');
  let customerGpsLink = '';

  if (detectLocationBtn && customerAddress) {
    detectLocationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser.');
        return;
      }

      detectLocationBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" class="spin"><path d="M12 4V2C6.48 2 2 6.48 2 12h2c0-4.41 3.59-8 8-8z"/></svg>
        <span>Locating...</span>
      `;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(5);
          const lng = position.coords.longitude.toFixed(5);
          customerGpsLink = `https://maps.google.com/?q=${lat},${lng}`;

          const existingAddr = customerAddress.value.trim();
          customerAddress.value = existingAddr
            ? `${existingAddr} (GPS: ${lat}, ${lng})`
            : `Near Ganeshpuri / Nilmatha Sector (GPS: ${lat}, ${lng})`;

          detectLocationBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--success)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            <span>Attached!</span>
          `;
          detectLocationBtn.style.borderColor = 'var(--success)';
        },
        (error) => {
          console.warn('Geolocation error:', error);
          detectLocationBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
            <span>Auto Detect</span>
          `;
          alert('Could not detect location automatically. Please enter your Lucknow address manually.');
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }

  // Quick Area Selector chips
  document.querySelectorAll('.area-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const area = chip.textContent.trim();
      if (customerAddress) {
        const cur = customerAddress.value.trim();
        customerAddress.value = cur ? `${cur}, ${area}` : `${area}, Lucknow`;
        customerAddress.focus();
      }
    });
  });

  // =========================================================================
  // 8. Booking Form Submission & WhatsApp Direct Dispatch
  // =========================================================================
  const bookingForm = document.getElementById('acBookingForm');
  const confirmationModal = document.getElementById('confirmationModal');
  const modalBookingId = document.getElementById('modalBookingId');
  const modalServiceName = document.getElementById('modalServiceName');
  const modalCustomerName = document.getElementById('modalCustomerName');
  const modalTimeSlot = document.getElementById('modalTimeSlot');
  const modalEstimatedAmount = document.getElementById('modalEstimatedAmount');
  const modalWhatsAppBtn = document.getElementById('modalWhatsAppBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('customerName')?.value.trim() || 'Valued Customer';
      const phone = document.getElementById('customerPhone')?.value.trim() || 'Not provided';
      const address = document.getElementById('customerAddress')?.value.trim() || 'Nilmatha / Lucknow';
      const date = document.getElementById('serviceDate')?.value || 'Today / Earliest';
      const timeSlot = document.getElementById('timeSlot')?.value || 'Urgent (Within 60 Mins)';
      const description = problemDescription?.value.trim() || 'Standard Servicing & Inspection';

      const selectedService = document.querySelector('input[name="serviceType"]:checked')?.value || 'jet-wash';
      const selectedAcType = document.querySelector('input[name="acType"]:checked')?.value || 'split';

      const serviceData = pricingRates[selectedService] || pricingRates['jet-wash'];
      let acTypeName = 'Split AC';
      let multiplier = 1;

      if (selectedAcType === 'window') {
        acTypeName = 'Window AC';
        multiplier = serviceData.windowMult;
      } else if (selectedAcType === 'inverter') {
        acTypeName = 'Inverter Split AC';
        multiplier = 1.05;
      } else if (selectedAcType === 'cassette') {
        acTypeName = 'Cassette / Commercial AC';
        multiplier = serviceData.cassetteMult;
      }

      const estimatedPrice = Math.round(serviceData.base * multiplier);
      const bookingId = `RK-LKO-${Math.floor(1000 + Math.random() * 9000)}`;

      // Update Modal
      if (modalBookingId) modalBookingId.textContent = bookingId;
      if (modalServiceName) modalServiceName.textContent = `${serviceData.name} (${acTypeName})`;
      if (modalCustomerName) modalCustomerName.textContent = name;
      if (modalTimeSlot) modalTimeSlot.textContent = `${date} | ${timeSlot}`;
      if (modalEstimatedAmount) modalEstimatedAmount.textContent = `₹${estimatedPrice}`;

      // Compose WhatsApp message
      const hasVoice = recordedAudioBlob ? 'Yes (Audio Note Recorded on Portal)' : (description ? 'Described via Voice/Text' : 'No');
      const hasAttachment = attachedFiles.length > 0 ? `${attachedFiles.length} file(s) attached` : 'None';
      const gpsNote = customerGpsLink ? `\n📍 *GPS Location:* ${customerGpsLink}` : '';

      const waText = 
`*NEW AC SERVICE BOOKING - R.K. ENTERPRISES*
━━━━━━━━━━━━━━━━━━━━
🆔 *Booking ID:* ${bookingId}
👤 *Customer Name:* ${name}
📞 *Phone:* ${phone}
📍 *Address:* ${address}${gpsNote}

🔧 *Service Required:* ${serviceData.name}
❄️ *AC Type:* ${acTypeName}
📅 *Preferred Slot:* ${date} (${timeSlot})
💰 *Estimated Rate:* ₹${estimatedPrice}

📝 *Problem Description:* 
"${description}"

🎙️ *Voice Note:* ${hasVoice}
📎 *Photos/Attachments:* ${hasAttachment}

🏢 *Local Service Hub:* Ganeshpuri Chauraha, Atalpuri Sector-3D, Hariharpur, Nilmatha, Lucknow
━━━━━━━━━━━━━━━━━━━━
_Please dispatch a verified technician._`;

      const businessWhatsAppNumber = '919450000000'; // Replace with business WhatsApp
      const waUrl = `https://wa.me/${businessWhatsAppNumber}?text=${encodeURIComponent(waText)}`;

      if (modalWhatsAppBtn) {
        modalWhatsAppBtn.href = waUrl;
      }

      // Show Confirmation Modal
      if (confirmationModal) {
        confirmationModal.classList.add('open');
      }
    });
  }

  if (closeModalBtn && confirmationModal) {
    closeModalBtn.addEventListener('click', () => {
      confirmationModal.classList.remove('open');
    });
    confirmationModal.addEventListener('click', (e) => {
      if (e.target === confirmationModal) {
        confirmationModal.classList.remove('open');
      }
    });
  }

  // =========================================================================
  // 9. FAQ Accordion
  // =========================================================================
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (questionBtn && answer) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close other FAQs
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('open');
            const otherAns = otherItem.querySelector('.faq-answer');
            if (otherAns) otherAns.style.maxHeight = null;
          }
        });

        if (isOpen) {
          item.classList.remove('open');
          answer.style.maxHeight = null;
        } else {
          item.classList.add('open');
          answer.style.maxHeight = answer.scrollHeight + 'px';
        }
      });
    }
  });

  // =========================================================================
  // 10. Date Input Defaults (Set to today's date)
  // =========================================================================
  const serviceDateInput = document.getElementById('serviceDate');
  if (serviceDateInput) {
    const today = new Date().toISOString().split('T')[0];
    serviceDateInput.value = today;
    serviceDateInput.min = today;
  }
});

