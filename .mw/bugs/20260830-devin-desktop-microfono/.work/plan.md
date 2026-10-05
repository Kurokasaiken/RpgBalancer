# Piano per il fix microfono Devin Desktop

## Problema
Devin.app (`com.exafunction.windsurf`) non ha il permesso macOS di usare il microfono.

## Azioni
1. Resettare i permessi TCC per il servizio `Microphone` usando `tccutil reset Microphone`.
2. Aprire il pannello `Privacy & Security > Microphone` delle Preferenze di Sistema per permettere all'utente di concedere il permesso a Devin.app.
3. In alternativa, forzare il prompt di richiesta permesso chiudendo e riaprendo Devin.app.

## Verifica
- Dopo il reset, aprendo Devin.app e provando l'input vocale, dovrebbe comparire il prompt di macOS che chiede di consentire l'uso del microfono.
- In `System Settings > Privacy & Security > Microphone` deve comparire `Devin` con il toggle attivo.

## Note
Non è possibile modificare il codice dell'app o TCC.db direttamente; l'intervento è configurativo sul sistema operativo.
