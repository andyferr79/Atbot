# ✅ FILE: runTriggerCron.py

import asyncio
from schedulers.triggerWatcher import trigger_pending_events

if __name__ == "__main__":
    print("\n🚀 Avvio Trigger IA Pendenti...")
    try:
        asyncio.run(trigger_pending_events())
        print("✅ Completato. Tutti i trigger eseguiti.")
    except Exception as e:
        print(f"❌ Errore esecuzione trigger: {str(e)}")
