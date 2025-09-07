// app.js
// Motor robusto de presentación de conversaciones con quick replies.
(function(){
  'use strict';
  
  // Validaciones de elementos DOM
  const chat = document.getElementById('chat');
  const quick = document.getElementById('quick');
  
  if (!chat || !quick) {
    console.error('Error: Elementos requeridos (chat, quick) no encontrados en el DOM');
    return;
  }

  // evalúa si un valor es función y la ejecuta con el contexto, con manejo de errores
  const resolve = (maybeFn, ctx) => {
    try {
      return typeof maybeFn === 'function' ? maybeFn(ctx) : maybeFn;
    } catch (error) {
      console.error('Error al resolver función:', error);
      return null;
    }
  };

  // Añade una burbuja al chat (bot o usuario) con validaciones de seguridad
  function addBubble(content, who='bot', ctx={}) {
    try {
      if (!chat) {
        console.error('Chat container no disponible');
        return null;
      }
      
      const html = resolve(content, ctx) ?? '';
      if (typeof html !== 'string') {
        console.warn('Contenido de burbuja no es string:', html);
        return null;
      }
      
      const div = document.createElement('div');
      div.className = `bubble ${who === 'bot' ? 'bot' : 'user'}`;
      
      // Sanitización básica del HTML para prevenir XSS
      div.innerHTML = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      
      chat.appendChild(div);
      chat.scrollTop = chat.scrollHeight;
      return div;
    } catch (error) {
      console.error('Error al añadir burbuja:', error);
      return null;
    }
  }

  // Configura quick replies con validaciones mejoradas
  function setQuick(items, onClick, ctx={}) {
    try {
      if (!quick) {
        console.error('Quick container no disponible');
        return;
      }
      
      const arr = resolve(items, ctx);
      quick.innerHTML = '';
      
      if (!arr || !Array.isArray(arr) || arr.length === 0) {
        return;
      }
      
      arr.forEach((it, index) => {
        try {
          const label = resolve(it, ctx);
          if (!label || typeof label !== 'string') {
            console.warn(`Quick reply inválido en índice ${index}:`, label);
            return;
          }
          
          const btn = document.createElement('button');
          btn.className = 'qbtn';
          btn.setAttribute('type', 'button');
          
          // Detectar botones de peligro/cancelación
          if (/storn|cancel|abbrech|cancelar|eliminar|borrar/i.test(label)) {
            btn.classList.add('danger');
          }
          
          btn.textContent = label;
          btn.onclick = (event) => {
            try {
              event.preventDefault();
              addBubble(label, 'user', ctx);
              
              if (onClick && typeof onClick === 'function') {
                const res = onClick(label, ctx) || null;
                expand(res);
              }
            } catch (error) {
              console.error('Error en click de quick reply:', error);
            }
          };
          
          quick.appendChild(btn);
        } catch (error) {
          console.error(`Error procesando quick reply ${index}:`, error);
        }
      });
    } catch (error) {
      console.error('Error configurando quick replies:', error);
    }
  }

  // Expande el resultado devuelto por un callback o step con validaciones
  function expand(res) {
    try {
      if (!res) return;
      
      if (Array.isArray(res)) {
        res.forEach((r, index) => {
          try {
            expand(r);
          } catch (error) {
            console.error(`Error expandiendo elemento ${index} del array:`, error);
          }
        });
        return;
      }
      
      if (typeof res === 'string') {
        if (res.trim() === '') {
          console.warn('Intento de ir a step vacío');
          return;
        }
        goto(res);
        return;
      }
      
      if (typeof res === 'function' || typeof res === 'number') {
        addBubble(res, 'bot', ctx);
        return;
      }
      
      if (typeof res === 'object' && res !== null) {
        if (res.bot) {
          addBubble(res.bot, 'bot', ctx);
        }
        if (res.quick) {
          setQuick(res.quick, res.onClick, ctx);
        }
        if (res.next) {
          const nxt = resolve(res.next, ctx);
          if (nxt && typeof nxt === 'string' && nxt.trim() !== '') {
            goto(nxt);
          }
        }
        return;
      }
      
      console.warn('Tipo de resultado no reconocido:', typeof res, res);
    } catch (error) {
      console.error('Error en expand:', error);
    }
  }

  // Contexto compartido con validaciones
  const ctx = { 
    lang: (window.i18n && window.i18n.lang ? window.i18n.lang() : 'es'), 
    choice: null, 
    clear: false 
  };
  let script = [];

  // Ejecuta un step por nombre con validaciones
  function goto(stepName) {
    try {
      if (!stepName || typeof stepName !== 'string') {
        console.error('Nombre de step inválido:', stepName);
        return;
      }
      
      if (!Array.isArray(script) || script.length === 0) {
        console.error('Script no inicializado o vacío');
        return;
      }
      
      const step = script.find((s) => s && s.name === stepName);
      if (!step) {
        console.warn(`Step no encontrado: ${stepName}`);
        return;
      }
      
      if (step.bot) {
        addBubble(step.bot, 'bot', ctx);
      }
      
      if (step.quick) {
        setQuick(step.quick, step.onClick, ctx);
      }
      
      if (step.next) {
        const nxt = resolve(step.next, ctx);
        if (nxt && typeof nxt === 'string' && nxt.trim() !== '') {
          // Prevenir recursión infinita
          setTimeout(() => goto(nxt), 0);
        }
      }
    } catch (error) {
      console.error('Error en goto:', error);
    }
  }

  // Inicia la conversación con validaciones robustas
  function start() {
    try {
      if (!window.demoFlows) {
        console.error('demoFlows no disponible. Asegúrese de cargar flows.js');
        return;
      }
      
      if (!window.i18n) {
        console.warn('i18n no disponible. Usando idioma por defecto.');
      }
      
      const lang = ctx.lang;
      const urlParams = new URLSearchParams(window.location.search);
      const scenario = urlParams.get('scenario') || window.DEMO_SCENARIO || 'schedule';
      
      const flows = window.demoFlows;
      
      if (scenario === 'manage' && typeof flows.flow_manage === 'function') {
        script = flows.flow_manage(lang);
      } else if (typeof flows.flow_schedule === 'function') {
        script = flows.flow_schedule(lang);
      } else {
        console.error('Flujo no disponible para el escenario:', scenario);
        return;
      }
      
      if (!Array.isArray(script) || script.length === 0) {
        console.error('Script generado es inválido:', script);
        return;
      }
      
      // Primera burbuja con validaciones
      const first = script[0];
      if (!first) {
        console.error('Primer step del script no disponible');
        return;
      }
      
      if (first.bot) {
        addBubble(first.bot, 'bot', ctx);
      }
      
      if (first.quick) {
        setQuick(first.quick, (valClicked, ctxArg) => {
          try {
            const res = first.onClick ? first.onClick(valClicked, ctxArg) : null;
            expand(res);
          } catch (error) {
            console.error('Error en onClick del primer step:', error);
          }
        }, ctx);
      }
      
    } catch (error) {
      console.error('Error crítico iniciando conversación:', error);
      // Mostrar mensaje de error al usuario
      if (chat) {
        chat.innerHTML = '<div class="bubble bot">❌ Error: No se pudo iniciar la conversación. Por favor, recarga la página.</div>';
      }
    }
  }

  // Iniciar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();