# Devin Desktop: microfono non funziona su macOS

## Descrizione
L'utente non riesce a usare il microfono come input in Devin Desktop su macOS.

## Passi per riprodurre
1. Aprire Devin Desktop su macOS.
2. Tentare di usare l'input vocale/microfono.
3. Il microfono non viene rilevato o non cattura audio.

## Comportamento atteso
Devin Desktop dovrebbe poter accedere al microfono e trascrivere/trasmettere l'input vocale.

## Comportamento effettivo
Il microfono non funziona; non è chiaro se il problema sia:
- Permesso microfono negato/non richiesto a livello di sistema (TCC)
- Devin Desktop non presente in `System Settings > Privacy & Security > Microphone`
- Microfono di default errato
- Problema di routing audio
- Bug dell'app Devin Desktop stessa

## Note aggiuntive
- macOS Darwin 25.5.0 (macOS 15.x)
- Il problema è relativo a un'app esterna (Devin Desktop), non al codice del repo RPG.
