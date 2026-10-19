import React from "react";
import { Link } from "react-router-dom";

export default function PageHeader({ trail = [], title, count, subtitle, children }) {
    return (
        <header>
            <div className="mk-breadcrumb">
                <Link to="/">Home</Link>
                {trail.map((item, i) => (
                    <React.Fragment key={item}>
                        {" > "}
                        {i === trail.length - 1 ? <strong>{item}</strong> : item}
                    </React.Fragment>
                ))}
            </div>
            <div className="mk-page-header">
                <div>
                    <div>
                        <h1>{title}</h1>
                        {count !== undefined && <span className="mk-count">({count})</span>}
                    </div>
                    {subtitle && <p>{subtitle}</p>}
                </div>
                {children && <div className="mk-page-header__actions">{children}</div>}
            </div>
        </header>
    );
}
