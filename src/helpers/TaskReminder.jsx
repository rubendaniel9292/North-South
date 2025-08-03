// ✅ Versión completa con sonido incorporado
import { useEffect, useState, useCallback, useRef } from "react";
import http from "./Http";
import alerts from "./Alerts";
import useAuth from "../hooks/useAuth";

const TaskReminder = () => {
  const authContext = useAuth();
  
  if (!authContext) {
    return null;
  }

  const { auth, loading } = authContext;
  const [tasks, setTasks] = useState([]);
  const [showReminder, setShowReminder] = useState(true);
  const reminderIntervalRef = useRef(null);

  // 🔊 Función para reproducir sonido de notificación
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // ✅ Sonido suave y profesional
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn("No se pudo reproducir el sonido:", error);
    }
  }, []);

  // ✅ Función para obtener tareas
  const fetchTasks = useCallback(async () => {
    // ✅ Verificar que auth.uuid exista
    if (!auth?.uuid) {
      console.log("❌ No hay auth.uuid disponible");
      return;
    }

    try {
      console.log("📡 Llamando a http.get con uuid:", auth.uuid);
      const response = await http.get(`users/get-task/${auth.uuid}/tasks`);
      if (response.data.status === "success") {
        const taskList = response.data.tasks || [];
        setTasks(taskList);
        console.log("✅ Tareas actualizadas:", taskList.length);
      }
    } catch (error) {
      console.error("💥 Error en fetchTasks:", error);
    }
  }, [auth?.uuid]);

  // ✅ Función de alerta simplificada
  const showTaskAlert = useCallback(() => {
    if (tasks.length > 0 && showReminder) {
      const taskCount = tasks.length;
      console.log("📢 Mostrando alerta para", taskCount, "tareas");

      // 🔊 Reproducir sonido ANTES de mostrar la alerta
      playNotificationSound();
      
      try {
        // ✅ Alerta simple
        alerts(
          "🔔 Recordatorio de Tareas",
          `Tienes ${taskCount} ${
            taskCount === 1 ? "tarea pendiente" : "tareas pendientes"
          } por resolver`,
          "info",
          {
            confirmButtonText: "OK",
            allowOutsideClick: true,
          }
        );
      } catch (error) {
        console.error("💥 Error mostrando alerta:", error);
      }
    }
  }, [tasks.length, showReminder, playNotificationSound]);

  // ✅ useEffect para obtener tareas - SOLO cuando loading sea false y auth.uuid exista
  useEffect(() => {
    if (!loading && auth?.uuid) {
      console.log("✅ Condiciones cumplidas, obteniendo tareas...");
      fetchTasks();
    } else {
      console.log("⏳ Esperando autenticación...");
    }
  }, [loading, auth?.uuid, fetchTasks]);

  // ✅ useEffect para recordatorios - SOLO cuando hay tareas
  useEffect(() => {
    if (tasks.length > 0 && showReminder) {
      // ✅ Primera alerta en 10 segundos
      const initialTimeout = setTimeout(() => {
        showTaskAlert();

        // ✅ Recordatorios cada 5 segundos después de la primera
        reminderIntervalRef.current = setInterval(showTaskAlert, 5000);
      }, 3000);

      return () => {
        clearTimeout(initialTimeout);
        if (reminderIntervalRef.current) {
          clearInterval(reminderIntervalRef.current);
        }
      };
    } else {
      // ✅ Limpiar timers si no hay tareas
      if (reminderIntervalRef.current) {
        clearInterval(reminderIntervalRef.current);
      }
    }
  }, [tasks.length, showReminder, showTaskAlert]);

  return null;
};

export default TaskReminder;
