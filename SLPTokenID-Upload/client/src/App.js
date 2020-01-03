import React from 'react';
import ImageUploader from 'react-images-upload';
import * as bitcoin from "./modules/bitcoin";
import { withStyles } from '@material-ui/core/styles';
import {signMessage} from "./modules/sign";
import Grid from '@material-ui/core/Grid';
import Image from 'material-ui-image';
import TextField from '@material-ui/core/TextField';
import Fade from "@material-ui/core/Fade";
import LinearProgress from "@material-ui/core/LinearProgress";
import { Button, IconButton } from '@material-ui/core';
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { ValidatorForm, TextValidator } from 'react-material-ui-form-validator';
import InputAdornment from '@material-ui/core/InputAdornment';
import {CopyToClipboard} from 'react-copy-to-clipboard';
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
        this.state = { 
          pictures: [], 
          previewimage: "", 
          imagehash: "",
          selectimage: false,
          slpaddress: {
            fetchingaddress: false, slpaddress: "", fetchedaddress: false, wrongtoken: false, legacy: ""
          },
          signature: "",
          slptokenid: "",
          sampledata: {
            privatekey:"L4XVRkgPMV8vHaRsZZAaDUwdri7GeFn8YE7RwJm1mNEPXdNtvV2Z",
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
        this.onCopyImageHash = this.onCopyImageHash.bind(this);
    }

    onCopyImageHash()
    {

      document.execCommand("copy");
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

      var fr = new FileReader();

      fr.onload = function()
      {
        let sha256_ = require('sha256');
        let atob_ = require('atob');
        let base64tobin = require("./modules/base64tobin");
        let binSz = atob_(fr.result.split("base64,")[1]);
        let bin = base64tobin(binSz);

        this.setState({ 
          previewimage:fr.result,
          imagehash: sha256_(bin)
        });

        this.setState({ sampledata: { ...this.state.sampledata, signature: signMessage(this.state.imagehash, this.state.sampledata.privatekey)}});
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
        this.setState({sampledata: {...this.state.sampledata, signature: bitcoin.signMessage(this.state.imagehash, this.state.sampledata.privatekey)}});
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
      var formData = new FormData();
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
        console.log(response);
        if(response.data.status === true)
        {
          alert(response.data.message);
        }
        else
        {
          alert(response.data.message);
        }
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
                  imgExtension={['.jpg', '.png', '.svg']}
                  maxFileSize={5242880}
                  key="imageuploader"
                  accept="image/x-png, image/svg+xml, image/jpeg"
                  name="file"
                  label="Max file size: 5mb, accepted: svg, png, jpg"
                /> 
              </Grid>
              {
                this.state.selectimage && 
                <Fade in={this.state.selectimage}>
                  <Grid container className={classes.fadein}>
                    <Grid item xs={3}>
                      {
                        this.state.previewimage && this.state.previewimage.length !== 0 && 
                        <Image src={this.state.previewimage} />
                      }
                      
                    </Grid>
                    <Grid item xs={9}>
                      <TextField
                        className={classes.imagedata}
                        id="outlined-multiline-static"
                        label="Image Hash"
                        variant="outlined"
                        value={this.state.imagehash}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="start">
                              <CopyToClipboard text={this.state.imagehash}>
                              
                                <IconButton
                                  onClick={this.onCopyImageHash}
                                >
                                  <FileCopyIcon />
                                </IconButton>
                              </CopyToClipboard>
                            </InputAdornment>
                          ),
                        }}
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
                    variant="outlined"
                    value={this.state.slpaddress.legacy}
                    validators={['required']}
                    errorMessages={['this field is required']}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="start">
                          <CopyToClipboard text={this.state.slpaddress.legacy}>
                          
                            <IconButton
                              onClick={this.onCopyImageHash}
                            >
                              <FileCopyIcon />
                            </IconButton>
                          </CopyToClipboard>
                        </InputAdornment>
                      ),
                    }}
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
    }
}

export default withStyles(useStyles)(App);