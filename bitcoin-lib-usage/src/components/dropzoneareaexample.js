import React, {Component} from 'react'
import {DropzoneArea} from 'material-ui-dropzone'
import {getImageSizeFromFile} from "./../modules/imagesizefromfile"
import * as bitcoin from "./../modules/bitcoin";
 
class DropzoneAreaExample extends Component{
  constructor(props){
    super(props);
    this.state = {
      files: []
    };
  }
  handleChange(files){
    this.setState({
      files: files
    });

    //getImageSizeFromFile(files[0], this.getImageSize);
    //var signature = signMessage("hello", "");
    //var verified = verifyMessage("hello", "H/DIn8uA1scAuKLlCx+/9LnAcJtwQQ0PmcPrJUq90aboLv3fH5fFvY+vmbfOSFEtGarznYli6ShPr9RXwY9UrIY=", "qq8phhuc9m3qtpvfuw79ecjjdagxq0938uu8ys35zu");
    //addressconversion();

    bitcoin.getSLPAddressFromTokenID("959a6818cba5af8aba391d3f7649f5f6a5ceb6cdcd2c2a3dcb5d2fbfc4b08e98", this.handleGetSLPAddress);
  }

  handleGetSLPAddress(token)
  {
    var address1 = bitcoin.getLegacyFromSLPAddress(token.address);
    //var address1 = "13Js7D3q4KvfSqgKN8LpNq57gcahrVc5JZ";
    var verified = bitcoin.verifyMessage("hello", "H/DIn8uA1scAuKLlCx+/9LnAcJtwQQ0PmcPrJUq90aboLv3fH5fFvY+vmbfOSFEtGarznYli6ShPr9RXwY9UrIY=", address1);
  }

  getImageSize(imgSize)
  {
    console.log(imgSize);
  }

  render(){
    return (
      <DropzoneArea 
        onChange={this.handleChange.bind(this)}
        />
    )  
  }
} 
 
export default DropzoneAreaExample;