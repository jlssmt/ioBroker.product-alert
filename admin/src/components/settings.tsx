import I18n from '@iobroker/adapter-react/i18n';
import { FormControl, IconButton, Input, InputLabel, MenuItem, Select } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { CreateCSSProperties } from '@material-ui/core/styles/withStyles';
import TextField from '@material-ui/core/TextField';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import React from 'react';
import { Item } from '../../../src/types/item.interface';

const styles = (): Record<string, CreateCSSProperties> => ({
    input: {
        marginTop: 0,
        minWidth: 300,
    },
    button: {
        marginRight: 20,
    },
    card: {
        maxWidth: 345,
        textAlign: 'center',
    },
    media: {
        height: 180,
    },
    column: {
        display: 'inline-block',
        verticalAlign: 'top',
        marginRight: 20,
    },
    columnLogo: {
        width: 350,
        marginRight: 0,
    },
    columnSettings: {
        width: 'calc(100% - 370px)',
    },
    controlElement: {
        //background: "#d2d2d2",
        marginBottom: 5,
    },
});

interface SettingsProps {
    classes: Record<string, string>;
    native: ioBroker.AdapterConfig;

    onChange: (attr: string, value: any) => void;
}

interface SettingsState {
    items: Item[]
}

class Settings extends React.Component<SettingsProps, SettingsState> {
    constructor(props: SettingsProps) {
        super(props);
        this.state = {
            items: !this.props.native.items || !this.props.native.items.length ? [{} as Item] : [...this.props.native.items]
        }
    }

    updateItemProperty(index: number, attr: string, value: string) {
        if (index < 0 || !attr || !value) {
            return;
        }
        const items: Item[] = [...this.state.items];
        items[index][attr] = value;
        this.props.onChange('items', items);
        this.setState({ ...this.state, items: items });
    }

    appendRow() {
        const items = [...this.state.items, {} as Item];
        this.props.onChange('items', items);
        this.setState({
            items: items
        });
    }

    deleteRow(index: number) {
        if (isNaN(index) || index < 0) return;
        const items: Item[] = [...this.state.items].filter((item, i) => i !== index);
        this.props.onChange('items', items);
        this.setState({ ...this.state, items: items });
    }

    renderInput(title: AdminWord, attr: string, type: string, index: number) {
        return (
            <TextField
                label={I18n.t(title)}
                className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
                style={{ marginLeft: 10, marginRight: 10 }}
                value={this.state.items[index][attr] || ''}
                type={type || 'text'}
                onChange={(e) => this.updateItemProperty(index, attr, e.target.value)}
                key={attr + index}
                margin="normal"
            />
        );
    }

    renderSelect(title: AdminWord, attr: string, index: number, options: { value: string; title: AdminWord }[], style?: React.CSSProperties) {
        return (
            <FormControl
                className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
                style={{ paddingTop: 5, ...style }}
            >
                <InputLabel>{I18n.t(title)}</InputLabel>
                <Select
                    value={this.state.items[index][attr] || ''}
                    onChange={(e) => this.updateItemProperty(index, attr, e.target.value === '_' ? '' : e.target.value as string)}
                    input={<Input name={attr} id={attr + '-helper'} />}
                >
                    {options.map((item) => (
                        <MenuItem
                            key={'key-' + item.value}
                            value={item.value || ''}
                        >
                            {I18n.t(item.title)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }

    render() {
        return (
            <>
                <div style={{ padding: 20, height: 'calc(100% - 50px)', overflow: 'scroll' }}>
                    {this.state.items.map((item, i) => (
                        <div style={{ marginTop: 20 }} key={i}>
                            {this.renderInput('productName', 'productName', 'text', i)}
                            {this.renderInput('url', 'url', 'text', i)}
                            <IconButton onClick={() => this.deleteRow(i)}>
                                <DeleteIcon />
                            </IconButton>
                        </div>
                    ))}
                    <IconButton onClick={() => this.appendRow()}>
                        <AddIcon />
                    </IconButton>
                </div>
            </>
        );
    }
}

export default withStyles(styles)(Settings);
