import os
import gradio as gr
import whisper
import tempfile
from datetime import datetime

# Funzione per trascrivere un file audio
def transcribe_audio(audio_file, model_size):
    # Carica il modello se non è già stato caricato o se è cambiato
    if not hasattr(transcribe_audio, "model") or transcribe_audio.model_size != model_size:
        transcribe_audio.model = whisper.load_model(model_size)
        transcribe_audio.model_size = model_size
    
    model = transcribe_audio.model
    
    try:
        # Esegui la trascrizione
        result = model.transcribe(audio_file)
        transcript = result["text"]
        
        # Crea il file di output
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"trascrizione_{timestamp}.txt"
        
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(f"File: {os.path.basename(audio_file)}\n\n{transcript}")
        
        return transcript, output_file
    except Exception as e:
        return f"Errore: {str(e)}", None

# Funzione per trascrivere più file audio
def transcribe_multiple(audio_files, model_size):
    if not audio_files:
        return "Nessun file selezionato", None
    
    # Carica il modello
    if not hasattr(transcribe_multiple, "model") or transcribe_multiple.model_size != model_size:
        transcribe_multiple.model = whisper.load_model(model_size)
        transcribe_multiple.model_size = model_size
    
    model = transcribe_multiple.model
    
    all_transcripts = []
    
    for audio_file in audio_files:
        try:
            # Esegui la trascrizione
            result = model.transcribe(audio_file)
            transcript = result["text"]
            all_transcripts.append(f"File: {os.path.basename(audio_file)}\n\n{transcript}\n\n{'='*50}\n")
        except Exception as e:
            all_transcripts.append(f"File: {os.path.basename(audio_file)}\n\nErrore: {str(e)}\n\n{'='*50}\n")
    
    # Crea il file di output
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"trascrizione_multipla_{timestamp}.txt"
    
    combined_transcript = "\n".join(all_transcripts)
    
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(combined_transcript)
    
    return combined_transcript, output_file

# Istruzioni per l'uso
instructions = """
# Come Usare il Trascrittore Audio

1. **Seleziona un modello** dal menu a tendina (più grande = più preciso ma più lento)
2. **Carica uno o più file audio** usando le schede corrispondenti
3. **Clicca su "Trascrivi"** e attendi il completamento
4. **Scarica i risultati** dal link generato

**Formati supportati**: MP3, WAV, M4A, FLAC, OGG, AAC

**Note sui modelli**:
- **tiny**: molto veloce, meno preciso (1GB di RAM)
- **base**: veloce, precisione media (1GB di RAM)
- **small**: equilibrato in velocità e precisione (2GB di RAM)
- **medium**: buona precisione, più lento (5GB di RAM)
- **large**: massima precisione, molto lento (10GB di RAM)
"""

# Crea l'interfaccia Gradio
with gr.Blocks(title="Trascrittore Audio") as demo:
    gr.Markdown("# 🎙️ Trascrittore Audio Automatico")
    gr.Markdown("Carica i tuoi file audio e ottieni le trascrizioni automaticamente!")
    
    # Selezione del modello
    model_dropdown = gr.Dropdown(
        choices=["tiny", "base", "small", "medium", "large"],
        value="small",
        label="Modello Whisper"
    )
    
    # Crea le tab per singolo file o multi file
    with gr.Tabs():
        with gr.TabItem("Singolo File"):
            audio_input = gr.Audio(type="filepath", label="Carica un file audio")
            transcribe_btn = gr.Button("Trascrivi")
            output = gr.Textbox(label="Trascrizione", lines=10)
            file_output = gr.File(label="Scarica trascrizione")
            
            transcribe_btn.click(
                fn=transcribe_audio,
                inputs=[audio_input, model_dropdown],
                outputs=[output, file_output]
            )
        
        with gr.TabItem("Più File"):
            audio_inputs = gr.File(file_count="multiple", label="Carica più file audio")
            multi_transcribe_btn = gr.Button("Trascrivi Tutti")
            multi_output = gr.Textbox(label="Trascrizione", lines=15)
            multi_file_output = gr.File(label="Scarica trascrizione")
            
            multi_transcribe_btn.click(
                fn=transcribe_multiple,
                inputs=[audio_inputs, model_dropdown],
                outputs=[multi_output, multi_file_output]
            )
    
    # Istruzioni
    with gr.Accordion("Istruzioni", open=False):
        gr.Markdown(instructions)

# Avvia l'applicazione
if __name__ == "__main__":
    demo.launch(share=False)