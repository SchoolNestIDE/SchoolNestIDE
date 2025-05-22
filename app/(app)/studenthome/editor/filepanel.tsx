export 
    function FilePanel(props: {
  refd: any,

}) {
  function back() {
    location.href = "/studenthome"
  }

  return (
    <div ref={props.refd} style={{ minWidth: "10%", fontSize: "18px", height:"100%"}} id="cmenurelev">

    </div>
  )
}
