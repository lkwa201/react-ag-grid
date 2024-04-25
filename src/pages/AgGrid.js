import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import {useMemo, useRef, useState} from "react";
import {read, utils} from "xlsx";
// eslint-disable-next-line
import _ from "lodash";
import axios from "axios";

const AgGrid = () =>  {

    const [hasBrowsed, setHasBrowsed] = useState(true);
    const gridRef = useRef(null);
    // eslint-disable-next-line
    const [gridApi, setGridApi] = useState(null);
    // eslint-disable-next-line
    const [gridColumnApi, setGridColumnApi] = useState(null);
    const [rowData, setRowData] = useState([]);
    const noRowsOverlayText = useMemo(() => { return "No data!"}, []);


    //헤더 정의
    const [columnDefs] = useState([
        { headerName: "책 제목", field: "name"},
        { headerName: "출판사", field: "publisher" },
        { headerName: "작가", field: "author" },
        { headerName: "가격", field: "price"},
        { headerName: "ISBN", field: "isbn"},
    ]);

    function excelDownTempl() {
        const xlsx = require('xlsx');
        const book = xlsx.utils.book_new();

        //컬럼 헤더 정의
        let columns = [];
        columns.push(['name', 'publisher', 'author', 'price', 'isbn']);

        const worksheetByAoa = xlsx.utils.aoa_to_sheet(columns);

        //컬럼 사이즈 지정
        worksheetByAoa['!cols'] = [
            {wch:30},
            {wch:15},
            {wch:15},
            {wch:15},
            {wch:15},
        ];

        //시트설정
        const sheetName = "";
        const templateExcelFileName = "react_도서업로드.xlsx";
        xlsx.utils.book_append_sheet(book, worksheetByAoa, sheetName);
        xlsx.writeFile(book, templateExcelFileName);
    }

    const brower = useRef(null);


    const uploadExcel = () => {
        let files = brower.current.files;
        if(files[0]) {
           let sheetInfo;
           const reader = new FileReader();
           reader.onload  = (e) => {

               const data = new Uint8Array(e.target.result);

               //get file
               let excelFile = read(data, {type:"array", cellText:false, cellDates: true});

               //get prased object
               const sheetName = excelFile.SheetNames[0];
               sheetInfo = utils.sheet_to_json(excelFile.Sheets[sheetName], {
                   header : 1,
                   dateNF : 'yyyy-mm-dd',
                   raw : false
               });
              setLoadData(sheetInfo);
           };
           reader.readAsArrayBuffer(files[0]);
        }
    };


    const isEmpty =(str)=> {
        return str === "" || str === undefined || str === null || str === "null";
    };

    const setLoadData = (sheetInfo) => {
        let arr = [];
        let failCnt = 0;
        for (let i = 1; i < sheetInfo.length; i++) {
            let item = sheetInfo[i];
            //각각의 항목(셀) 체크 시 주석 해제
            // if(!_.isEmpty(item[0]) && !_.isEmpty(item[1]) && !_.isEmpty(item[2]) && !_.isEmpty(item[3]) && !_.isEmpty(item[4])) {
            //     arr.push(item);
            // }
            // else
            // {
            //     let cellIndex = 0;
            //     for (const cell of item) {
            //         if(cell===undefined) {
            //             break;
            //         }
            //         cellIndex++;
            //     }
            //     const line = Number(i);
            //     const column = cellIndex;
            //     const msg = `${line} 행의 ${columnDefs[column].headerName}의 이(가) 누락되었습니다.`;
            //     alert(msg);
            //     failCnt++;
            // }

            //체크 하지 않을 시 사용.
            arr.push(item);

        }

        //빈 엑셀파일 업로드 시-
        if(arr.length === 0) {
            alert(`엑셀 내용을 확인해주세요.`);
            return;
        }

        //헤더 별로 셀 데이터 구분 및 데이터 바인딩 처리.
        if(failCnt=== 0) {
            let loadDataList = [];
            for (let i = 0; i < arr.length ; i++) {
                let item = arr[i];
                let param = {
                    name : item[0],
                    publisher : item[1],
                    author : item[2],
                    price : item[3],
                    isbn : item[4],
                };
                loadDataList.push(param);
            }

            //그리드 데이터에 로드.
            setRowData(loadDataList);
        }
    }

    const onGridReady = (params) => {
        setGridApi(params.api);
        setGridColumnApi(params.columnApi);
    };
    
    //저장
    const onSave = () => {
        let postData = [];
        for (const bindRow of rowData) {
            postData.push(bindRow);
        }

        axios.post('http://localhost:9090/api/v1/ag-grid/data-write', postData, {
                headers: { "Content-Type": `application/json`}
            }
        ).then((res) => {
            console.log(res);
        });
    }


    return (
        <>
            <div className="ag-theme-quartz" style={{height: 500, width:1000}}>
                <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    ref={gridRef}
                    onGridReady={onGridReady}
                    overlayNoRowsTemplate={noRowsOverlayText}
                />
            </div>
            <div>
                <button onClick={excelDownTempl}>엑셀 템플릿 다운로드</button>
                {hasBrowsed && (<input type="file" id="addFile" accept={'.xlsx'} ref={brower}
                                       onChange={(e) => uploadExcel(e.target.files)}
                />)}
                <button onClick={()=>brower.current.click()}>업로드</button>
                <button onClick={onSave}>저장</button>
            </div>
        </>
    )


}
export default AgGrid;