import React from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { withStyles } from '@material-ui/core';
import { PropTypes } from 'prop-types';

const styles = () => ({
    title: {
        flexGrow: 1
    }
});


class ChartsToolbar extends React.Component
{
    constructor(props)
    {
        super(props);
        this.state = {
            selected: this.props.default
        }
    }
    render()
    {
        const classes = this.props.classes; 

        return (
            <Toolbar>
                <Typography variant="h6" className={classes.title} >
                    {this.props.title}
                </Typography>
                <Button color={this.props.selected === "M3" ? "secondary" : "default"} onClick={() => {this.setState({selected: "M3"}); this.props.onClick("M3");}}>M3</Button>
                <Button color={this.props.selected === "M5" ? "secondary" : "default"} onClick={() => {this.setState({selected: "M5"}); this.props.onClick("M5")}}>M5</Button>
                <Button color={this.props.selected === "M15" ? "secondary" : "default"} onClick={() => {this.setState({selected: "M15"}); this.props.onClick("M15")}}>M15</Button>
                <Button color={this.props.selected === "M30" ? "secondary" : "default"} onClick={() => {this.setState({selected: "M30"}); this.props.onClick("M30")}}>M30</Button>
                <Button color={this.props.selected === "H1" ? "secondary" : "default"} onClick={() => {this.setState({selected: "H1"}); this.props.onClick("H1")}}>H1</Button>
                <Button color={this.props.selected === "H4" ? "secondary" : "default"} onClick={() => {this.setState({selected: "H4"}); this.props.onClick("H4")}}>H4</Button>
                <Button color={this.props.selected === "D1" ? "secondary" : "default"} onClick={() => {this.setState({selected: "D1"}); this.props.onClick("D1")}}>D1</Button>
                <Button color={this.props.selected === "D7" ? "secondary" : "default"} onClick={() => {this.setState({selected: "D7"}); this.props.onClick("D7")}}>D7</Button>
                <Button color={this.props.selected === "1M" ? "secondary" : "default"} onClick={() => {this.setState({selected: "1M"}); this.props.onClick("1M")}}>1M</Button>
            </Toolbar>
        );
    }
}

ChartsToolbar.propTypes = {
    onClick: PropTypes.func,
    classes: PropTypes.object,
    default: PropTypes.string,
    selected: PropTypes.string,
    title: PropTypes.string
}

export default withStyles(styles)(ChartsToolbar);