import React, { Component} from "react"
import Cookies from 'js-cookie'
import marked from 'marked'


const apiUrl = '/api/v1/chatbot/'
const loadingTimeFactor = 10;

class App extends Component {

  constructor (props) {
    super(props)
    this.state = {
      conversation: [],
      value: '',
      loading: false
    }

    this.textarea = React.createRef()
    this.handleTextChange = this.handleTextChange.bind(this)
    this.handleKeyDown = this.handleKeyDown.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  componentDidMount() {
    this.fetchResponse()
  }

  componentDidUpdate(){
      if (!this.state.loading) {
        this.textarea.current.focus()
      }
  }

  calculateLoadingTime(text) {
    if (this.state.loading) {
      const textLenght = text.length < 150 ? text.length : 150
      return textLenght * loadingTimeFactor
    } else {
      return 0
    }
  }

  fetchResponse() {
    const { conversation } = this.state
    const [ last_statement ] = conversation.slice(-1)

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken')
    }

    let params = {
      method: 'GET',
      headers
    }
    if (last_statement) {
      console.info(last_statement);

      params = {
        method: 'POST',
        body: JSON.stringify(last_statement),
        headers
      }
    }

    fetch(apiUrl, params)
      .then(response => response.json())
      .then(statement => {
        const { conversation } = this.state

        console.info(statement);

        conversation.push(statement)

        setTimeout(function () {
          this.setState({
            conversation,
            value: '',
            loading: false
          })
        }.bind(this), this.calculateLoadingTime(statement.reply))


      }, error => {
        this.setState({ error })
      }
    )
  }

  handleTextChange(e) {
    this.setState({ value: e.target.value })
  }

  handleKeyDown(e) {
    if(e.keyCode == 13 && e.shiftKey == false) {
      this.handleSubmit(e)
    }
  }

  handleSubmit (e) {
    e.preventDefault()

    const { conversation, value } = this.state
    const [ last_statement ] = conversation.slice(-1)

    if (!value) {
      return
    }

    let in_response_to = last_statement.id
    if (last_statement.forward.conclusion) {
      in_response_to = null
    } else if (last_statement.forward.id) {
      in_response_to = last_statement.forward.id
    } else if (last_statement.conclusion) {
      in_response_to = null
    }

    conversation.push({
      persona: 'user',
      message: value,
      in_response_to: in_response_to
    })
    this.setState({ conversation, loading: true }, this.fetchResponse)
  }

  render() {
    const { conversation, value } = this.state

    return(
      <div className='row chat'>
        <div className='col-md-6 offset-md-3'>
          {
            conversation.map((statement, i) => {
              if (statement.persona == 'user') {
                return (
                  <div key={i}>
                    <div className={'chat__statement--user'}>{statement.message}</div>
                  </div>
                )
              } else {
                return (
                  <div key={i}>
                    {statement.reply &&
                    <div className={'chat__statement--chatbot'}
                         dangerouslySetInnerHTML={{__html: marked(statement.reply || '')}}></div>
                    }
                    {statement.conclusion &&
                    <div className={'chat__statement--chatbot'}
                         dangerouslySetInnerHTML={{__html: marked(statement.conclusion || '')}}></div>
                    }
                    {statement.forward && statement.forward.reply &&
                    <div className={'chat__statement--chatbot'}
                         dangerouslySetInnerHTML={{__html: marked(statement.forward.reply || '')}}></div>
                    }
                    {statement.forward && statement.forward.conclusion &&
                    <div className={'chat__statement--chatbot'}
                         dangerouslySetInnerHTML={{__html: marked(statement.forward.conclusion || '')}}></div>
                    }
                  </div>
                )
              }
            })
          }
          { this.state.loading &&
            <div>
              <div className="spinner-grow spinner-grow-sm" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <div className="spinner-grow spinner-grow-sm" role="status">
                <span className="sr-only">Loading...</span>
              </div>
              <div className="spinner-grow spinner-grow-sm" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          }
        { !this.state.loading &&
        <form className="chat__statement--user" onSubmit={this.handleSubmit}>
          <div className="form-group">
            <textarea
              className="form-control"
              value={value}
              required="required"
              onChange={this.handleTextChange}
              onKeyDown={this.handleKeyDown}
              ref={this.textarea}
            />
          </div>
          <input type="submit" className="btn btn-primary" value={gettext('Submit')}/>
        </form>
        }
        </div>
      </div>
    )
  }
}

export default App
