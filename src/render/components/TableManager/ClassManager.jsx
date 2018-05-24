import React from 'react'
import {observable} from 'mobx'
import {observer} from 'mobx-react'

export default observer(class ClassManager extends React.Component{
  constructor(props) {
    super(props);
    
    this.selfState = observable.object({

    });
  }
  
  render() {
    return (
      <div className="full" style={{display:"flex"}}>
        
      </div>
    );
  }
})