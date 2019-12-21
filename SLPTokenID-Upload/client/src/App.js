import React from 'react';
import ImageUploader from 'react-images-upload';
import * as bitcoin from "./modules/bitcoin";
import { makeStyles, withStyles } from '@material-ui/core/styles';
import {signMessage} from "./modules/sign";
import Grid from '@material-ui/core/Grid';
import Image from 'material-ui-image';
import TextField from '@material-ui/core/TextField';
import Fade from "@material-ui/core/Fade";
import LinearProgress from "@material-ui/core/LinearProgress";
import { Button } from '@material-ui/core';
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import axios from "axios";

const useStyles = theme => ({
  root: {
    flexGrow: 1,
    width: '80%',
    margin: 'auto',
  },
  previewimage:{
    width: '300px',
    margin: 'auto',
  },
  imagedata: {
    width: '100%',
  },
  fadein: {

  },
  uploadbutton: {
    width: '100%'
  }
});

class App extends React.Component {
 
    constructor(props) {
        super(props);
        this.state = { pictures: [], previewimage: "", 
          selectimage: false,
          slpaddress: {
            fetchingaddress: false, slpaddress: "", fetchedaddress: false, wrongtoken: false, legacy: ""
          },
          signature: "",
          slptokenid: "",
          sampledata: {
            privatekey:"KxtfZsBCJKhp86rsqy8UxX84mCqFXZzW1f8ArU6RTFXAF2VGpfbE",
            address: "13Js7D3q4KvfSqgKN8LpNq57gcahrVc5JZ" ,
            signature: ""
          }
        };

        this.onDrop = this.onDrop.bind(this);
        this.onInputTokenID = this.onInputTokenID.bind(this);
        this.onGetSLPAddress = this.onGetSLPAddress.bind(this);
        this.onInputSignature = this.onInputSignature.bind(this);
        this.onClickSubmit = this.onClickSubmit.bind(this);
        this.onChangeTokenID = this.onChangeTokenID.bind(this);
    }

    onChangeTokenID(e)
    {
      this.setState({slptokenid: e.target.value});
    }
 
    onDrop(picture) {
      this.setState({
          pictures: picture,
          previewimage: "",
          selectimage: true
      });

      var fr = new FileReader;

      fr.onload = function()
      {
        this.setState({ previewimage:fr.result });
        this.setState({ sampledata: { ...this.state.sampledata, signature: signMessage(fr.result, this.state.sampledata.privatekey)}});
      }.bind(this);

      fr.readAsDataURL(picture[picture.length-1]);
    }

    onInputTokenID(e)
    {
      try{
        if(!this.state.slpaddress.fetchingaddress)
        {
          bitcoin.getSLPAddressFromTokenID(e.target.value, this.onGetSLPAddress);
          this.setState(
            {
              slpaddress: { ...this.state.slpaddress, fetchedaddress: false, fetchingaddress: true},
              slptokenid: e.target.value
            });
        }
      }
      catch(e)
      {
        alert("fetch slp address failed");
        throw e;
      }
      
      
    }

    getSampleSignature()
    {
      if(this.state.previewimage.length > 0 && this.state.slpaddress.legacy > 0)
      {
        this.setState({sampledata: {...this.state.sampledata, signature: bitcoin.signMessage(this.state.previewimage, this.state.sampledata.privatekey)}});
      }
    }

    onInputSignature(e)
    {
      this.setState({signature: e.target.value});
    }

    onGetSLPAddress(address)
    {
      if(address != null)
        this.setState({slpaddress: { ...this.state.slpaddress, fetchedaddress: true, fetchingaddress: false, wrongtoken: false, slpaddress: address, legacy: bitcoin.getLegacyFromSLPAddress(address)}});
      else
      {
        this.setState({slpaddress: {...this.state.slpaddress, fetchingaddress: false, wrongtoken: true}});
      }
    }
    
    onClickSubmit(e)
    {
      var formData = new FormData;
      formData.append("file", this.state.pictures[this.state.pictures.length-1]);
      formData.append("tokenid", this.state.slptokenid);
      formData.append("signature", this.state.signature);
      formData.append("legacy", this.state.slpaddress.legacy);

      console.log(formData);
      axios.post("http://localhost:3001/upload", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      .then(function(response){
        alert(response.data);
      })
      .catch(function(error){
        console.log("upload failed", error);
      });
    } 
    
    render() {

      const {classes} = this.props; 

      return(
        <div className={classes.root}>
          <ValidatorForm 
            ref="form"
            onSubmit={this.onClickSubmit}
            onError={errors => console.log(errors)}
          >
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <ImageUploader
                  withIcon={true}
                  buttonText='Choose images'
                  onChange={this.onDrop}
                  imgExtension={['.jpg', '.gif', '.png', '.gif', '.svg']}
                  maxFileSize={5242880}
                  key="imageuploader"
                  name="file"
                /> 
              </Grid>
              {
                this.state.selectimage && 
                <Fade in={this.state.selectimage}>
                  <Grid container className={classes.fadein}>
                    <Grid item xs={3}>
                      {
                        this.state.previewimage && this.state.previewimage.length != 0 && 
                        <Image src={this.state.previewimage} />
                      }
                      
                    </Grid>
                    <Grid item xs={9}>
                      <TextField
                        className={classes.imagedata}
                        id="outlined-multiline-static"
                        multiline
                        label="Image Data"
                        rows="20"
                        disabled
                        variant="outlined"
                        value={this.state.previewimage}
                      />
                    </Grid>
                  </Grid>              
                </Fade>
              }
              
              <Grid item xs={12}>
                  <TextValidator
                      className={classes.imagedata}
                      id="outlined-multiline-static"
                      label={this.state.slpaddress.wrongtoken ? "Wrong Token ID" : "Token ID"}
                      error={this.state.slpaddress.wrongtoken}
                      variant="outlined"
                      onBlur={this.onInputTokenID}
                      onChange={this.onChangeTokenID}
                      value={this.state.slptokenid}
                      validators={['required']}
                      errorMessages={['this field is required']}
                  />
                <Fade in={this.state.slpaddress.fetchingaddress}>
                  <LinearProgress color="secondary" />
                </Fade>                            
              </Grid>
              <Grid item xs={12}>
                <TextValidator
                    className={classes.imagedata}
                    id="outlined-multiline-static"
                    label="SLP Address"
                    disabled
                    variant="outlined"
                    value={this.state.slpaddress.legacy}
                    validators={['required']}
                    errorMessages={['this field is required']}
                />
              </Grid>
              <Grid item xs={12}>
                <TextValidator
                    className={classes.imagedata}
                    id="outlined-multiline-static"
                    label="Signature"
                    variant="outlined"
                    value={this.state.signature}
                    onChange={this.onInputSignature}
                    validators={['required']}
                    errorMessages={['this field is required']}
                />
              </Grid>

              <Grid item xs={9}>
              </Grid>
              <Grid item xs={3}>
                <Button 
                  type="submit"
                  variant="contained" 
                  color="primary" 
                  startIcon={<CloudUploadIcon />}
                  className={classes.uploadbutton}
                  >
                  Upload
                </Button>
              </Grid>
            </Grid>
          </ValidatorForm>
          <Grid container>
            <Grid item xs={12}>
              <TextField
                value={this.state.sampledata.signature}
                label="Sample Signature"
              >

              </TextField>
            </Grid>
          </Grid>
        </div>
      );
      /*
      return (
        <form action="http://localhost:3001/upload" method="post" encType="multipart/form-data">
          <ImageUploader
              withIcon={true}
              buttonText='Choose images'
              onChange={this.onDrop}
              imgExtension={['.jpg', '.gif', '.png', '.gif']}
              maxFileSize={5242880}
              key="imageuploader"
              name="file"
          /> 

          {this.state.previewimage && <img src={this.state.previewimage} key="image" />}
          {this.state.previewimage && <div style={{wordWrap:'break-word', height: "200px", overflow: "scroll", width: '100%'}}  key="textarea"> {this.state.previewimage} </div>}
          <div>
            <label> Token id: </label><input name="tokenid" onBlur={this.onInputTokenID} ></input> 
            <label> Signature: </label><input name="signature" onChange={this.onInputSignature} value={this.state.signature}></input> 
            <div>{this.state.slpaddress.fetchingaddress && <label> Looking up address</label>} </div>
            <div>
              {<label> Address: </label>}
              { <input name="legacy" value={this.state.slpaddress.legacy}></input>}
            </div>
            <button type="submit" onClick={this.onClickSubmit}>Submit</button>
          </div>
          Address: <textarea value={this.state.sampledata.address}></textarea>
          Private Key: <textarea value={this.state.sampledata.privatekey}></textarea>
          Signature: <textarea value={this.state.sampledata.signature}></textarea>
        </form>
      );
      */
    }
}

export default withStyles(useStyles)(App);