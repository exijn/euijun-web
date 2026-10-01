import { createRoot } from 'react-dom/client'
import { Editor } from './Editor'
import '../src/styles.css'
import './editor.css'

createRoot(document.getElementById('root')!).render(<Editor />)
