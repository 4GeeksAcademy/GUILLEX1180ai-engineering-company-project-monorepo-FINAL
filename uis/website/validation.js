/* ============================================================
   validation.js — TrackFlow Lead Form Validation
   Validación completa del formulario lead-form
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('lead-form');
  if (!form) return;

  // ==================== UTILITY FUNCTIONS ====================

  function getEl(id) {
    return document.getElementById(id);
  }

  function showError(id) {
    const el = getEl(id);
    if (el) el.classList.remove('hidden');
  }

  function hideError(id) {
    const el = getEl(id);
    if (el) el.classList.add('hidden');
  }

  function addSuccessClass(input) {
    input.classList.add('input-success');
    input.classList.remove('input-error');
  }

  function addErrorClass(input) {
    input.classList.add('input-error');
    input.classList.remove('input-success');
  }

  function removeValidationClasses(input) {
    input.classList.remove('input-success', 'input-error');
  }

  function getErrorId(input) {
    return input.getAttribute('aria-describedby');
  }

  // ==================== CAMPOS DEL FORMULARIO ====================

  const fields = {
    companyName: getEl('companyName'),
    contactPerson: getEl('contactPerson'),
    email: getEl('email'),
    phone: getEl('phone'),
    website: getEl('website'),
    country: getEl('country'),
    productType: getEl('productType'),
    monthlyVolume: getEl('monthlyVolume'),
    has3pl: document.querySelectorAll('input[name="has3pl"]'),
    services: document.querySelectorAll('input[name="services"]'),
    comments: getEl('comments'),
    privacy: getEl('privacy'),
  };

  const submitBtn = getEl('submit-btn');
  const resetBtn = getEl('reset-btn');
  const successMessage = getEl('success-message');
  const volumeWarning = getEl('volume-warning');

  // ==================== CONTADOR DE CARACTERES ====================
  if (fields.comments) {
    var counter = getEl('char-count');
    var remaining = getEl('comments-remaining');
    fields.comments.addEventListener('input', function () {
      counter.textContent = this.value.length;
      if (remaining) {
        remaining.textContent = 500 - this.value.length;
      }
      if (this.value.length > 0) {
        validateComments();
      } else {
        hideError('err-comments');
        removeValidationClasses(fields.comments);
      }
    });
  }

  // ==================== FUNCIONES DE VALIDACIÓN ====================

  function validateCompanyName() {
    const input = fields.companyName;
    const value = input.value.trim();
    const errorId = getErrorId(input);

    if (value.length < 2) {
      addErrorClass(input);
      showError(errorId);
      return false;
    }
    addSuccessClass(input);
    hideError(errorId);
    return true;
  }

  function validateContactPerson() {
    const input = fields.contactPerson;
    const value = input.value.trim();
    const errorId = getErrorId(input);
    const words = value.split(/\s+/).filter(function (w) { return w.length > 0; });

    if (words.length < 2) {
      addErrorClass(input);
      showError(errorId);
      return false;
    }
    addSuccessClass(input);
    hideError(errorId);
    return true;
  }

  function validateEmail() {
    const input = fields.email;
    const value = input.value.trim();
    const errorId = getErrorId(input);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(value)) {
      addErrorClass(input);
      showError(errorId);
      return false;
    }
    addSuccessClass(input);
    hideError(errorId);
    return true;
  }

  function validatePhone() {
    const input = fields.phone;
    const value = input.value.trim();
    const errorId = getErrorId(input);
    const phoneRegex = /^\+[0-9]{1,3}[-\s./0-9]{5,20}$/;

    if (!phoneRegex.test(value)) {
      addErrorClass(input);
      showError(errorId);
      return false;
    }
    addSuccessClass(input);
    hideError(errorId);
    return true;
  }

  function validateWebsite() {
    const input = fields.website;
    const value = input.value.trim();
    const errorId = getErrorId(input);

    if (value === '') {
      removeValidationClasses(input);
      hideError(errorId);
      return true;
    }

    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid protocol');
      }
      addSuccessClass(input);
      hideError(errorId);
      return true;
    } catch (_) {
      addErrorClass(input);
      showError(errorId);
      return false;
    }
  }

  function validateCountry() {
    const input = fields.country;
    const value = input.value;
    const errorId = getErrorId(input);

    if (!value) {
      addErrorClass(input);
      showError(errorId);
      return false;
    }
    addSuccessClass(input);
    hideError(errorId);
    return true;
  }

  function validateProductType() {
    const input = fields.productType;
    const value = input.value;
    const errorId = getErrorId(input);

    if (!value) {
      addErrorClass(input);
      showError(errorId);
      return false;
    }
    addSuccessClass(input);
    hideError(errorId);
    return true;
  }

  function validateMonthlyVolume() {
    const input = fields.monthlyVolume;
    const value = input.value;
    const errorId = getErrorId(input);

    if (!value) {
      addErrorClass(input);
      showError(errorId);
      return false;
    }
    addSuccessClass(input);
    hideError(errorId);

    // Mostrar/ocultar alerta de volumen bajo
    if (value === '0-100') {
      volumeWarning.classList.remove('hidden');
    } else {
      volumeWarning.classList.add('hidden');
    }

    return true;
  }

  function validateHas3pl() {
    const checked = Array.from(fields.has3pl).some(function (r) {
      return r.checked;
    });
    const errorId = 'err-has3pl';

    if (!checked) {
      showError(errorId);
      return false;
    }
    hideError(errorId);
    return true;
  }

  function validateServices() {
    const checked = Array.from(fields.services).some(function (cb) {
      return cb.checked;
    });
    const errorId = 'err-services';

    if (!checked) {
      showError(errorId);
      return false;
    }
    hideError(errorId);
    return true;
  }

  function validatePrivacy() {
    const input = fields.privacy;
    const errorId = 'err-privacy';

    if (!input.checked) {
      showError(errorId);
      return false;
    }
    hideError(errorId);
    return true;
  }

  function validateComments() {
    const input = fields.comments;
    const value = input.value;
    const errorId = 'err-comments';
    const remaining = getEl('comments-remaining');
    var maxLength = 500;

    if (value.length > maxLength) {
      if (remaining) remaining.textContent = maxLength - value.length;
      addErrorClass(input);
      showError(errorId);
      return false;
    }
    addSuccessClass(input);
    hideError(errorId);
    return true;
  }

  // ==================== VALIDACIÓN COMPLETA ====================

  const validators = [
    { name: 'companyName', fn: validateCompanyName },
    { name: 'contactPerson', fn: validateContactPerson },
    { name: 'email', fn: validateEmail },
    { name: 'phone', fn: validatePhone },
    { name: 'website', fn: validateWebsite },
    { name: 'country', fn: validateCountry },
    { name: 'productType', fn: validateProductType },
    { name: 'monthlyVolume', fn: validateMonthlyVolume },
    { name: 'has3pl', fn: validateHas3pl },
    { name: 'services', fn: validateServices },
    { name: 'comments', fn: validateComments },
    { name: 'privacy', fn: validatePrivacy },
  ];

  function validateAll() {
    let isValid = true;
    for (var i = 0; i < validators.length; i++) {
      if (!validators[i].fn()) {
        isValid = false;
      }
    }
    return isValid;
  }

  // ==================== EVENTOS EN TIEMPO REAL ====================

  // blur
  fields.companyName.addEventListener('blur', validateCompanyName);
  fields.contactPerson.addEventListener('blur', validateContactPerson);
  fields.email.addEventListener('blur', validateEmail);
  fields.phone.addEventListener('blur', validatePhone);
  fields.website.addEventListener('blur', validateWebsite);

  // input (revalidación mientras escribe)
  fields.companyName.addEventListener('input', validateCompanyName);
  fields.contactPerson.addEventListener('input', validateContactPerson);
  fields.email.addEventListener('input', validateEmail);
  fields.phone.addEventListener('input', validatePhone);
  fields.website.addEventListener('input', validateWebsite);

  // change para selects
  fields.country.addEventListener('change', function () {
    if (this.value) {
      addSuccessClass(this);
      validateCountry();
    } else {
      removeValidationClasses(this);
    }
  });

  fields.productType.addEventListener('change', function () {
    if (this.value) {
      addSuccessClass(this);
      validateProductType();
    } else {
      removeValidationClasses(this);
    }
  });

  fields.monthlyVolume.addEventListener('change', function () {
    validateMonthlyVolume();
    if (!this.value) {
      removeValidationClasses(this);
    }
  });

  // Radios 3PL
  Array.from(fields.has3pl).forEach(function (radio) {
    radio.addEventListener('change', validateHas3pl);
  });

  // Checkboxes servicios
  Array.from(fields.services).forEach(function (cb) {
    cb.addEventListener('change', validateServices);
  });

  // Checkbox privacidad
  fields.privacy.addEventListener('change', validatePrivacy);

  // Comments
  fields.comments.addEventListener('blur', validateComments);

  // ==================== SUBMIT ====================

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    successMessage.classList.add('hidden');

    var isValid = validateAll();

    if (!isValid) {
      var firstError = form.querySelector('.input-error, select.input-error');
      if (!firstError) {
        var firstHiddenError = form.querySelector('[aria-live="polite"]:not(.hidden)');
        if (firstHiddenError) {
          firstError = firstHiddenError;
        }
      }
      if (firstError) {
        firstError.focus();
      }
      return;
    }

    // --- SIMULACIÓN DE ENVÍO ---
    submitBtn.classList.add('btn-loading');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    // Recopilar datos
    var formData = {
      companyName: fields.companyName.value.trim(),
      contactPerson: fields.contactPerson.value.trim(),
      email: fields.email.value.trim(),
      phone: fields.phone.value.trim(),
      website: fields.website.value.trim() || null,
      country: fields.country.value,
      productType: fields.productType.value,
      monthlyVolume: fields.monthlyVolume.value,
      has3pl: Array.from(fields.has3pl)
        .filter(function (r) { return r.checked; })
        .map(function (r) { return r.value; })[0],
      services: Array.from(fields.services)
        .filter(function (cb) { return cb.checked; })
        .map(function (cb) { return cb.value; }),
      comments: fields.comments.value.trim() || null,
      privacy: fields.privacy.checked,
    };

    console.log('[TrackFlow] Lead form data:', formData);

    // Simular envío (1.5s)
    setTimeout(function () {
      submitBtn.classList.remove('btn-loading');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar solicitud';

      successMessage.classList.remove('hidden');

      form.reset();

      // Limpiar clases de validación
      form.querySelectorAll('.input-success, .input-error').forEach(function (el) {
        el.classList.remove('input-success', 'input-error');
      });

      // Resetear contador
      var counter = getEl('char-count');
      if (counter) counter.textContent = '0';

      // Ocultar warning de volumen
      volumeWarning.classList.add('hidden');

      // Scroll al mensaje de éxito
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1500);
  });

  // ==================== RESET ====================

  resetBtn.addEventListener('click', function () {
    // Las validaciones nativas del reset ya limpian los campos
    setTimeout(function () {
      form.querySelectorAll('.input-success, .input-error').forEach(function (el) {
        el.classList.remove('input-success', 'input-error');
      });
      // Ocultar todas las alertas de error
      form.querySelectorAll('[aria-live="polite"]').forEach(function (el) {
        el.classList.add('hidden');
      });
      // Ocultar warning de volumen
      volumeWarning.classList.add('hidden');
      // Ocultar mensaje de éxito
      successMessage.classList.add('hidden');
      // Resetear contador
      var counter = getEl('char-count');
      if (counter) counter.textContent = '0';
    }, 0);
  });

  console.log('[TrackFlow] Validación del formulario lead-form inicializada correctamente.');
});