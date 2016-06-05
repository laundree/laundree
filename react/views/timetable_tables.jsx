/**
 * Created by budde on 28/05/16.
 */
var TimetableTable = require('./timetable_table.jsx')
var React = require('react')
const TimetableTables = (props) => <section id='TimeTable'>
  <ul className='times'>
    <li>1</li>
    <li>2</li>
    <li>3</li>
    <li>4</li>
    <li>5</li>
    <li>6</li>
    <li>7</li>
    <li>8</li>
    <li>9</li>
    <li>10</li>
    <li>11</li>
    <li>12</li>
    <li>13</li>
    <li>14</li>
    <li>15</li>
    <li>16</li>
    <li>17</li>
    <li>18</li>
    <li>19</li>
    <li>20</li>
    <li>21</li>
    <li>22</li>
    <li>23</li>
  </ul>
  {props.dates.map((date) => <TimetableTable date={date} machines={props.machines} key={date} />)}
  <ul className='times'>
    <li>1</li>
    <li>2</li>
    <li>3</li>
    <li>4</li>
    <li>5</li>
    <li>6</li>
    <li>7</li>
    <li>8</li>
    <li>9</li>
    <li>10</li>
    <li>11</li>
    <li>12</li>
    <li>13</li>
    <li>14</li>
    <li>15</li>
    <li>16</li>
    <li>17</li>
    <li>18</li>
    <li>19</li>
    <li>20</li>
    <li>21</li>
    <li>22</li>
    <li>23</li>
  </ul>
</section>

TimetableTables.propTypes = {
  dates: React.PropTypes.arrayOf(React.PropTypes.instanceOf(Date)).isRequired,
  machines: React.PropTypes.arrayOf(React.PropTypes.object).isRequired
}

module.exports = TimetableTables
