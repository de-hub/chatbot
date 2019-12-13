import React, { Component} from "react"
import Cookies from 'js-cookie';


const apiUrl = '/api/v1/chatbot/'

class App extends Component {

  constructor (props) {
    super(props)
    this.state = {
      conversation: [],
      text: '',
      loading: false
    }
    this.textarea = React.createRef();
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
      const textLenght = text.length
      return textLenght * 50
    } else {
      return 0
    }
  }

  fetchResponse() {
    const { conversation, text } = this.state

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken')
    }

    let params = {
      method: 'GET',
      headers
    }
    if (text) {
      params = {
        method: 'POST',
        body: JSON.stringify({ text }),
        headers
      }
    }

    fetch(apiUrl, params)
      .then(response => response.json())
      .then(result => {
        const { conversation, text } = this.state

        conversation.push({
          persona: result.persona,
          text: result.text
        })

        setTimeout(function () {
          this.setState({
            conversation,
            text: '',
            loading: false
          })
        }.bind(this), this.calculateLoadingTime(result.text))


      }, error => {
        this.setState({ error })
      }
    )
  }

  handleTextChange(e) {
    this.setState({ text: e.target.value })
  }

  handleKeyDown(e) {
    if(e.keyCode == 13 && e.shiftKey == false) {
      this.handleSubmit(e)
    }
  }

  handleSubmit (e) {
    e.preventDefault()

    if (!this.state.text) {
      return
    }
    const { conversation, text } = this.state
    conversation.push({
      persona: 'client',
      text: text
    })
    this.setState({ conversation, loading: true }, this.fetchResponse)
  }

  render() {
    const { conversation, text } = this.state

    return(
      <div className='row chat'>
        <div className='col-md-6 offset-md-3'>
          {
            conversation.map((item, i) => {
              const className = item.persona == 'bot:ChatBot' ? 'chat__item--chatbot' : 'chat__item--user'
              return (
                <div key={i} className={className}>{item.text}</div>
              )
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
        <form className="chat__item--user" onSubmit={this.handleSubmit}>
          <div className="form-group">
            <textarea
              className="form-control"
              value={text}
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
