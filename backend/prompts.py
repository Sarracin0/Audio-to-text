"""
Prompt templates per l'elaborazione delle trascrizioni
"""

# Prompt per Whisper API - migliora la qualità della trascrizione
WHISPER_PROMPT = """Questa è una nota vocale personale in italiano per un post LinkedIn. 
Trascrivi accuratamente includendo la punteggiatura appropriata."""

# Prompt principale per Claude - trasforma in post LinkedIn
CLAUDE_LINKEDIN_PROMPT = """Il tuo compito è aiutarmi a scrivere contenuti per LinkedIn in modo più veloce.  
Riceverai come input una trascrizione vocale o un testo grezzo, che può essere disordinato, colloquiale e senza formattazione.  
Il tuo obiettivo è trasformarlo in un post LinkedIn ben scritto, scorrevole e fedele al mio stile.  
Devi mantenere il contenuto originale, senza aggiungere opinioni o informazioni inventate.  
Il valore, i pensieri e le riflessioni devono restare miei: tu fai solo editing, formattazione e ottimizzazione narrativa.  

### Linee guida di scrittura
- **Tono**: equilibrato tra professionale e colloquiale → mai troppo "markettaro" o promozionale.  
- **Stile narrativo**: discorsivo, chiaro, fluido.  
  - Alterna paragrafi brevi e punti elenco → NO muri di testo, NO solo liste.  
  - Mantieni uno stile da "racconto" con ritmo naturale.  
- **Espressioni tipiche**: inserisci espressioni colloquiali quando ha senso ("mah", "capitemi...", "una figata", "fidati", ecc.) per rendere il post autentico.  
- **Struttura consigliata** (adatta in base al contenuto grezzo che ti passo):
  1. Una frase iniziale d'impatto o curiosa per attirare attenzione.  
  2. Breve contesto o storia personale.  
  3. Il problema o la difficoltà affrontata.  
  4. La soluzione, il ragionamento o l'insight principale (anche con elenco numerato o puntato).  
  5. Una chiusura che invita alla riflessione o al confronto → spesso con una domanda diretta al lettore.  

### Cosa NON fare
- Non aggiungere nuove idee che non emergono dal testo originale.  
- Non scrivere in stile troppo "pubblicitario" o artificiale.  
- Non rendere il post telegrafico: deve sembrare un flusso naturale di pensiero.  

### Trascrizione da elaborare:

{transcription}

### Output:
Risultato atteso: un post LinkedIn curato, leggibile e pronto alla pubblicazione, che conserva la mia voce e le mie opinioni ma in una forma chiara ed efficace."""

# Prompt alternativo per note generali (non LinkedIn)
CLAUDE_GENERAL_PROMPT = """Sei un assistente intelligente che analizza trascrizioni di note vocali.
Il tuo compito è:
1. Correggere eventuali errori di trascrizione
2. Strutturare il contenuto in modo chiaro e organizzato
3. Identificare punti chiave e azioni da intraprendere
4. Fornire un riassunto conciso alla fine

Trascrizione da analizzare:

{transcription}

Per favore, elabora questa nota vocale e restituisci una versione migliorata e strutturata."""

# Dizionario per selezionare il prompt in base al tipo
PROMPTS = {
    "linkedin": CLAUDE_LINKEDIN_PROMPT,
    "general": CLAUDE_GENERAL_PROMPT
}

def get_prompt(prompt_type="linkedin"):
    """
    Restituisce il prompt appropriato in base al tipo richiesto
    
    Args:
        prompt_type (str): Tipo di prompt ("linkedin" o "general")
    
    Returns:
        str: Template del prompt
    """
    return PROMPTS.get(prompt_type, CLAUDE_LINKEDIN_PROMPT)