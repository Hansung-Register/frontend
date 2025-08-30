import React from "react";
import '../styles/NaverClock.css';

const CLOCK_RADIUS = 125;
const CIRCLE_LENGTH = 2 * Math.PI * CLOCK_RADIUS;

interface NaverClockProps {
  secondsLeft: number;
}

const NaverClock: React.FC<NaverClockProps> = ({ secondsLeft }) => {
  // 10:59:45부터 11:00:00까지 카운트다운
  const baseHour = 10;
  const baseMinute = 59;
  const baseSecond = 45;
  const elapsed = 15 - secondsLeft;
  let seconds = baseSecond + elapsed;
  let minutes = baseMinute;
  let hours = baseHour;
  if (seconds >= 60) {
    seconds -= 60;
    minutes += 1;
    if (minutes >= 60) {
      minutes = 0;
      hours += 1;
    }
  }
  const percent = seconds / 60;
  const dashoffset = CIRCLE_LENGTH * (1 - percent);
  const angle = percent * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const dotX = Math.cos(rad) * CLOCK_RADIUS;
  const dotY = Math.sin(rad) * CLOCK_RADIUS;
  const timeText = `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="naver-clock-container">
      <div className="second_circle _timer_donut">
        <svg width="252" height="252" overflow="visible">
          <g transform="translate(126,126)">
            <circle
              r={CLOCK_RADIUS}
              fill="none"
              transform="rotate(-90)"
              stroke="rgb(3, 170, 90)"
              strokeWidth="2"
              strokeLinecap="butt"
              strokeDasharray={CIRCLE_LENGTH}
              strokeDashoffset={dashoffset}
            ></circle>
            <circle
              cx={dotX}
              cy={dotY}
              r="4.5"
              fill="white"
              stroke="rgb(3, 170, 90)"
              strokeWidth="3"
            ></circle>
            <text
              x="0"
              y="0"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="32"
              fill="#222"
              fontWeight="bold"
            >
              {timeText}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default NaverClock;
