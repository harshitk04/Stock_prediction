import React from 'react'
import {FormControl,InputLabel,Select,MenuItem} from '@mui/material'

const StockSelector = ({stocks,selectedStock, onStockChange}) =>{
    return(
        <FormControl fullWidth>
            <InputLabel>Select Stock</InputLabel>
            <Select
                value={selectedStock}
                onChange={(e)=> onStockChange(e.target.value)}
                label = "Select Stock"
            >
                {stocks.map((stock)=>(
                    <MenuItem key = {stock} value={stock}>
                        {stock}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default StockSelector;