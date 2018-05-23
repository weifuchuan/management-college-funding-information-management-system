import React from "react"
import {observer} from "mobx-react"
import {observable} from 'mobx'

export default observer(class Search extends React.Component {

  constructor(props) {
    super(props);

  }


  render() {
    return (
      <div>
        Search
      </div>
    );
  }

})