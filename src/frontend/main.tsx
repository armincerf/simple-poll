import { render } from 'preact'
import { QuestionPage } from './Question'
import { AnswerPage }   from './Answer'
import { HomePage }     from './Home'

const [, , view, id] = location.pathname.split('/')  // /poll/question/1
const idNum = id ? +id : 777;

if (view === 'question') render(<QuestionPage id={idNum}/>, document.body)
else if (view === 'answer') render(<AnswerPage id={idNum}/>, document.body)
else render(<HomePage />, document.body) // Handle root path and other routes 