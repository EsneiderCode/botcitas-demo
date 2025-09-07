// flows.js
// Define los flujos de conversación para distintos escenarios y textos internacionales.
(function(){
  /**
   * Diccionario de textos comunes según la clave y el idioma
   * @param {string} key
   * @param {string} lang
   * @returns {string}
   */
  const L = (key, lang) => {
    const dict = {
      welcome: {
        es: "Hola 👋 Tu instalación de fibra está lista. Selecciona tu idioma:",
        de: "Hallo 👋 Ihre Glasfaser-Installation ist bereit. Bitte wählen Sie Ihre Sprache:"
      },
      consent: {
        es: "Con tu confirmación aceptas nuestro aviso de privacidad (DSGVO). Responde **ACEPTO** o escribe **/borrar_datos**.",
        de: "Mit Ihrer Bestätigung stimmen Sie unseren DSGVO-Hinweisen zu. Antworten Sie **JA** oder senden Sie **/daten_loeschen**."
      },
      terms: {
        es: "Términos y privacidad: ",
        de: "AGB & Datenschutz: "
      },
      chooseSlot: {
        es: "Estos son los horarios disponibles. Toca uno para continuar:",
        de: "Diese Zeitfenster sind verfügbar. Tippen Sie zur Auswahl:"
      },
      chosen: {
        es: "Elegiste:",
        de: "Ausgewählt:"
      },
      confirmQ: {
        es: "¿Confirmar?",
        de: "Bestätigen?"
      },
      confirmed: {
        es: "✅ Cita confirmada.",
        de: "✅ Termin bestätigt."
      },
      reminderQ: {
        es: "¿Deseas recordatorio?",
        de: "Erinnerung senden?"
      },
      reminderSet: {
        es: "🔔 Recordatorio configurado.",
        de: "🔔 Erinnerung gesendet."
      },
      slotTaken: {
        es: "Ese horario se acaba de ocupar. ¿Te sirven estas opciones?",
        de: "Dieser Slot wurde soeben belegt. Passen diese Alternativen?"
      },
      manageCTA: {
        es: "Puedes *Cambiar*, *Cancelar* o *Estado* cuando quieras.",
        de: "Sie können *Ändern*, *Stornieren* oder *Status* jederzeit nutzen."
      },
      manageHeader: {
        es: "Gestión de cita",
        de: "Terminverwaltung"
      },
      changeWhat: {
        es: "¿Qué deseas cambiar?",
        de: "Was möchten Sie ändern?"
      },
      status: {
        es: "📋 Estado de la cita:",
        de: "📋 Terminstatus:"
      },
      postNps: {
        es: "¿Cómo fue tu experiencia? Responde un número del **1** al **5**.",
        de: "Wie war Ihre Erfahrung? Antworten Sie mit **1** bis **5**."
      }
    };
    return dict[key][lang];
  };

  // Definición de slots por defecto (fijos) con enlaces .ics
  const defaultSlots = [
    {
      id: 'A',
      start: '2025-09-16T13:00:00+02:00',
      end: '2025-09-16T15:00:00+02:00',
      ics: './ics/cita_2025-09-16_13-15.ics'
    },
    {
      id: 'B',
      start: '2025-09-17T09:00:00+02:00',
      end: '2025-09-17T11:00:00+02:00',
      ics: './ics/cita_2025-09-17_09-11.ics'
    }
  ];

  /**
   * Obtiene la lista de slots desde localStorage (si el usuario ha configurado horarios) o usa los predeterminados.
   * Cada slot tendrá id incremental (A, B, C...), start y end en formato ISO con timezone +02:00 si no se indica.
   * El campo ics se deja nulo para generar dinámicamente el enlace .ics.
   */
  function loadSlots() {
    try {
      const stored = localStorage.getItem('bot_slots');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          return parsed.filter(item => item && item.start && item.end).map((item, idx) => {
            const appendTZ = (val) => {
              // Si ya incluye zona horaria explícita (+/-), lo dejamos; de lo contrario añadimos +02:00 (Europe/Berlin)
              return /[\+\-]\d{2}:?\d{2}$/.test(val) ? val : `${val}+02:00`;
            };
            return {
              id: String.fromCharCode(65 + idx),
              start: appendTZ(item.start),
              end: appendTZ(item.end),
              ics: null
            };
          });
        }
      }
    } catch (err) {
      console.warn('Error al leer bot_slots', err);
    }
    return defaultSlots;
  }

  /**
   * Obtiene la política de cancelación establecida por el usuario o la predeterminada.
   */
  function getCancelPolicy(lang) {
    const policy = localStorage.getItem('bot_cancel_policy') || (lang === 'de' ? 'Stornierung sin coste bis 24h vorher.' : 'Cancelación sin coste hasta 24 h antes.');
    return policy;
  }

  /**
   * Genera un enlace .ics como Data URI para la cita seleccionada. Si el usuario activó la opción de usar nombre de cliente,
   * se incluye en el título (SUMMARY). Utiliza la zona horaria de Europa/Berlín y la hora actual para el DTSTAMP.
   * @param {Object} sel Slot seleccionado con start y end
   * @param {string} lang Idioma
   */
  function generateIcs(sel, lang) {
    try {
      const clientName = localStorage.getItem('bot_client_name') || '';
      const useName = localStorage.getItem('bot_use_client_name') === 'true';
      const dtstamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
      const toUtc = (iso) => {
        const d = new Date(iso);
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
      };
      const dtstart = toUtc(sel.start);
      const dtend = toUtc(sel.end);
      const summary = lang === 'de'
        ? `Glasfaser-Installation ${useName && clientName ? '('+clientName+')' : ''}`
        : `Instalación de fibra ${useName && clientName ? '('+clientName+')' : ''}`;
      const description = `ID Cita: ${META.id}\n${lang === 'de' ? 'Techniker' : 'Técnico'}: ${META.tech}`;
      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//CLARITY//BotCitas//ES',
        'BEGIN:VEVENT',
        `UID:${META.id}@clarity.local`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${summary}`,
        `LOCATION:${META.zone}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      const uri = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
      const filename = `${META.id}.ics`;
      return { uri, filename };
    } catch (err) {
      console.warn('Error generando .ics', err);
      return { uri: sel.ics || '', filename: `${META.id}.ics` };
    }
  }

  // Datos estáticos de la cita (pueden modificarse para cada demo)
  const META = {
    tech: "CLARITY-07",
    zone: "PLZ 29227",
    id: "C-2025-0916-1300"
  };
  // Enlace genérico a la política DSGVO (puede sustituirse por uno real)
  const DSGVO = "https://ejemplo.clarity/datenschutz";

  /**
   * Genera el flujo de agendar cita en el idioma indicado
   * @param {string} lang Idioma ('es' | 'de')
   */
  function flow_schedule(lang) {
    // cargar slots dinámicos a partir de configuración del usuario o usar predeterminados
    const slots = loadSlots();
    return [
      {
        bot: L('welcome', lang) + `\n\n${L('terms', lang)}<a class="link" href="${DSGVO}" target="_blank">DSGVO</a>`,
        quick: lang === 'de' ? ['Deutsch','Español'] : ['Español','Deutsch'],
        onClick: (val, ctx) => {
          if (val === 'Deutsch') ctx.lang = 'de';
          if (val === 'Español') ctx.lang = 'es';
          return 'consent';
        }
      },
      {
        name: 'consent',
        bot: L('consent', lang),
        quick: lang === 'de' ? ['JA','/daten_loeschen'] : ['ACEPTO','/borrar_datos'],
        onClick: (val, ctx) => {
          if (val.startsWith('/')) {
            ctx.clear = true;
            return { bot: lang === 'de' ? '✅ Daten gelöscht / anonymisiert.' : '✅ Datos borrados / anonimizados.' };
          }
          return 'slots';
        }
      },
      {
        name: 'slots',
        bot: L('chooseSlot', lang),
        quick: slots.map(s => `${i18n.tDate(s.start)} → ${i18n.tDate(s.end)}`),
        onClick: (val, ctx) => {
          const idx = slots.findIndex(s => val.includes(i18n.tDate(s.start)));
          ctx.choice = slots[idx];
          return {
            bot: `${L('chosen', lang)} ${i18n.tDate(ctx.choice.start)} – ${i18n.tDate(ctx.choice.end)}\n${L('confirmQ', lang)}`,
            quick: lang === 'de' ? ['Ja','Andere Zeit','Abbrechen'] : ['Sí','Otra hora','Cancelar'],
            onClick: (v) => {
              // Cambiar hora / Otra hora
              if ((lang === 'de' && v === 'Andere Zeit') || (lang === 'es' && v === 'Otra hora')) {
                return [
                  { bot: L('slotTaken', lang) },
                  {
                    quick: slots.map(s => `${i18n.tDate(s.start)} → ${i18n.tDate(s.end)}`),
                    onClick: (v2, ctx2) => {
                      const idx2 = slots.findIndex(s => v2.includes(i18n.tDate(s.start)));
                      ctx2.choice = slots[idx2];
                      return 'confirm';
                    }
                  }
                ];
              }
              // Cancelar
              if ((lang === 'de' && v === 'Abbrechen') || (lang === 'es' && v === 'Cancelar')) {
                return { bot: lang === 'de' ? '❌ Abgebrochen.' : '❌ Cancelado.' };
              }
              // Confirmar (Ja o Sí)
              return 'confirm';
            }
          };
        }
      },
      {
        name: 'confirm',
        bot: (ctx) => {
          const sel = ctx.choice || slots[0];
          const lines = [];
          lines.push(L('confirmed', ctx.lang));
          lines.push(`🗓 ${i18n.tDate(sel.start)} – ${i18n.tDate(sel.end)}`);
          if (ctx.lang === 'de') {
            lines.push(`👨‍🔧 Techniker: ${META.tech}`);
            lines.push(`📍 Zone: ${META.zone}`);
            lines.push(`🆔 ID: ${META.id}`);
          } else {
            lines.push(`👨‍🔧 Técnico: ${META.tech}`);
            lines.push(`📍 Zona: ${META.zone}`);
            lines.push(`🆔 ID: ${META.id}`);
          }
          // Generar enlace .ics dinámico
          const { uri, filename } = generateIcs(sel, ctx.lang);
          const linkText = ctx.lang === 'de' ? 'Kalender (.ics)' : 'Añadir al calendario (.ics)';
          lines.push(`<a class="link" href="${uri}" download="${filename}">${linkText}</a>`);
          return lines.join('\n');
        },
        next: () => 'reminder'
      },
      {
        name: 'reminder',
        bot: (ctx) => L('reminderQ', ctx.lang),
        quick: (ctx) => ctx.lang === 'de' ? ['Ja 🔔','Nein'] : ['Sí 🔔','No'],
        onClick: (v, ctx) => {
          const positive = v.includes('Ja') || v.includes('Sí');
          return {
            bot: positive ? L('reminderSet', ctx.lang) : (ctx.lang === 'de' ? 'Ohne Erinnerung.' : 'Sin recordatorio.'),
            next: 'manage'
          };
        }
      },
      {
        name: 'manage',
        bot: (ctx) => L('manageCTA', ctx.lang)
      }
    ];
  }

  /**
   * Genera el flujo de gestión de citas en el idioma indicado
   * @param {string} lang Idioma
   */
  function flow_manage(lang) {
    // cargar slots dinámicos para gestión
    const slots = loadSlots();
    return [
      {
        bot: () => {
          const slot = slots[0];
          let head = `🧭 ${L('manageHeader', lang)}`;
          head += '\n';
          if (lang === 'de') {
            head += `Bestätigt: ${i18n.tDate(slot.start)} – ${i18n.tDate(slot.end)}\nTechniker: ${META.tech} | Zone: ${META.zone} | ID: ${META.id}`;
          } else {
            head += `Confirmada: ${i18n.tDate(slot.start)} – ${i18n.tDate(slot.end)}\nTécnico: ${META.tech} | Zona: ${META.zone} | ID: ${META.id}`;
          }
          return head;
        },
        quick: lang === 'de' ? ['Datum ändern','Uhrzeit ändern','Stornieren','Status prüfen'] : ['Cambiar fecha','Cambiar hora','Cancelar','Ver estado'],
        onClick: (val, ctx) => {
          // Ver estado / Status
          if (val.includes('Status') || val.includes('estado')) {
            return {
              bot: `${L('status', lang)}\n${lang === 'de' ? `✅ Bestätigt | 👨‍🔧 ${META.tech} | 📍 ${META.zone} | 🆔 ${META.id}` : `✅ Confirmada | 👨‍🔧 ${META.tech} | 📍 ${META.zone} | 🆔 ${META.id}`}`
            };
          }
          // Cancelar / Stornieren
          if (val.toLowerCase().includes('storn') || val.toLowerCase().includes('cancel')) {
            return [
              {
                bot: getCancelPolicy(lang) + (lang === 'de' ? ' Möchten Sie stornieren?' : ' ¿Confirmas cancelación?')
              },
              {
                quick: lang === 'de' ? ['Ja','Nein'] : ['Sí','No'],
                onClick: (v) => {
                  return {
                    bot: (v === 'Ja' || v === 'Sí') ? (lang === 'de' ? '❌ Storniert.' : '❌ Cancelada.') : (lang === 'de' ? 'Ok, nicht storniert.' : 'Ok, no cancelada.')
                  };
                }
              }
            ];
          }
          // Cambiar fecha / Datum ändern
          if (val.toLowerCase().includes('datum') || val.toLowerCase().includes('fecha')) {
            return [
              { bot: L('changeWhat', lang) },
              {
                quick: slots.map(s => `${i18n.tDate(s.start)} → ${i18n.tDate(s.end)}`),
                onClick: () => {
                  return { bot: lang === 'de' ? '📅 Neues Datum gespeichert.' : '📅 Nueva fecha guardada.' };
                }
              }
            ];
          }
          // Cambiar hora / Uhrzeit ändern
          if (val.toLowerCase().includes('uhrzeit') || val.toLowerCase().includes('hora')) {
            return [
              { bot: L('changeWhat', lang) },
              {
                quick: ['+30 min','+1 h','-1 h'],
                onClick: () => {
                  return { bot: lang === 'de' ? '⏱️ Neue Uhrzeit gespeichert.' : '⏱️ Nueva hora guardada.' };
                }
              }
            ];
          }
          return null;
        }
      },
      {
        bot: () => L('postNps', lang),
        quick: ['1','2','3','4','5'],
        onClick: (v) => {
          return {
            bot: lang === 'de' ? `Danke! Note ${v} gespeichert.` : `¡Gracias! Nota ${v} guardada.`
          };
        }
      }
    ];
  }

  // Exponer en el contexto global las funciones y datos para el motor de la conversación
  window.demoFlows = {
    flow_schedule,
    flow_manage,
    // Exportamos los slots por defecto para compatibilidad, pero el motor usa loadSlots() en tiempo de ejecución
    slots: defaultSlots,
    META
  };
})();